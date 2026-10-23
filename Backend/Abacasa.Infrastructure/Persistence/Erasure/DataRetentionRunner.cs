using Abacasa.Application.Interfaces;
using Abacasa.Infrastructure.Configuration;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using static Abacasa.Infrastructure.Persistence.Erasure.HouseholdDataTables;

namespace Abacasa.Infrastructure.Persistence.Erasure;

// İmha işi. Global filtre dışında (ham SQL / IgnoreQueryFilters), bütün hanelerde çalışır.
// Her adım kendi transaction'ında; bir tablo hata verirse loglanır ve atlanır, diğerleri devam eder.
public class DataRetentionRunner : IDataRetentionRunner
{
    private readonly ApplicationDbContext _context;
    private readonly IHouseholdEraser _householdEraser;
    private readonly IUserAnonymizer _userAnonymizer;
    private readonly IPermissionService _permissionService;
    private readonly DataRetentionSettings _settings;
    private readonly ILogger<DataRetentionRunner> _logger;

    public DataRetentionRunner(ApplicationDbContext context, IHouseholdEraser householdEraser, IUserAnonymizer userAnonymizer,
        IPermissionService permissionService, IConfiguration configuration, ILogger<DataRetentionRunner> logger)
    {
        _context = context;
        _householdEraser = householdEraser;
        _userAnonymizer = userAnonymizer;
        _permissionService = permissionService;
        _settings = configuration.GetSection("DataRetention").Get<DataRetentionSettings>() ?? new DataRetentionSettings();
        _logger = logger;
    }

    public async Task<IReadOnlyDictionary<string, int>> RunAsync(CancellationToken cancellationToken = default)
    {
        var report = new Dictionary<string, int>();
        var now = DateTime.UtcNow;
        var softDeleteCutoff = now.AddDays(-_settings.SoftDeletePurgeDays);
        var tokenCutoff = now.AddDays(-_settings.ExpiredTokenPurgeDays);
        var loginCutoff = now.AddDays(-_settings.LoginAttemptPurgeDays);

        // a) Hane verisi: süresi geçmiş soft-deleted satırlar, çocuktan ebeveyne
        foreach (var table in Get(_context))
            await StepAsync(report, table.Table, () => PurgeSoftDeletedAsync(table, softDeleteCutoff, report, cancellationToken), cancellationToken);

        // b) Kullanıcılar: fiziksel silinmez, anonimleşir (zaten anonimse atlanır)
        await StepAsync(report, "Users (anonimlestirilen)", async () =>
        {
            var userIds = await _context.Users.IgnoreQueryFilters()
                .Where(u => u.IsDeleted && u.DeletedDate < softDeleteCutoff && !u.Email.EndsWith(UserAnonymizer.DeletedEmailDomain))
                .Select(u => u.Id)
                .ToListAsync(cancellationToken);
            foreach (var userId in userIds)
            {
                await _userAnonymizer.AnonymizeAsync(userId, cancellationToken);
                _permissionService.ClearUserPermissionCache(userId);
            }
            return userIds.Count;
        }, cancellationToken);

        // c) Süresi geçmiş soft-deleted haneler: hane silme rutini
        await StepAsync(report, "Tenants (silinen hane)", async () =>
        {
            var tenantIds = await _context.Tenants.IgnoreQueryFilters()
                .Where(t => t.IsDeleted && t.DeletedDate < softDeleteCutoff)
                .Select(t => t.Id)
                .ToListAsync(cancellationToken);
            foreach (var tenantId in tenantIds)
            {
                var affected = await _householdEraser.EraseAsync(tenantId, cancellationToken);
                foreach (var userId in affected)
                    _permissionService.ClearUserPermissionCache(userId);
            }
            return tenantIds.Count;
        }, cancellationToken);

        // d) Yardımcı tablolar
        await StepAsync(report, "RefreshTokens", () => _context.RefreshTokens.IgnoreQueryFilters()
            .Where(t => t.ExpiryDate < tokenCutoff || (t.IsRevoked && t.RevokedDate < tokenCutoff))
            .ExecuteDeleteAsync(cancellationToken), cancellationToken);
        await StepAsync(report, "UserVerificationTokens", () => _context.UserVerificationTokens.IgnoreQueryFilters()
            .Where(t => t.ExpiresAt < tokenCutoff || (t.IsUsed && t.UsedAt < tokenCutoff))
            .ExecuteDeleteAsync(cancellationToken), cancellationToken);
        await StepAsync(report, "PasswordResetTokens", () => _context.PasswordResetTokens.IgnoreQueryFilters()
            .Where(t => t.ExpiresAt < tokenCutoff || (t.IsUsed && t.UsedAt < tokenCutoff))
            .ExecuteDeleteAsync(cancellationToken), cancellationToken);
        // Accepted / Revoked / Expired durumuna o süreden önce geçmiş davetler
        await StepAsync(report, "HouseholdInvitations (sonuclanmis)", () => _context.HouseholdInvitations.IgnoreQueryFilters()
            .Where(i => i.AcceptedAt < tokenCutoff || i.RevokedAt < tokenCutoff
                || (i.AcceptedAt == null && i.RevokedAt == null && i.ExpiresAt < tokenCutoff))
            .ExecuteDeleteAsync(cancellationToken), cancellationToken);
        await StepAsync(report, "LoginAttempts", () => _context.LoginAttempts.IgnoreQueryFilters()
            .Where(a => a.AttemptedAt < loginCutoff)
            .ExecuteDeleteAsync(cancellationToken), cancellationToken);

        _logger.LogInformation("Imha isi bitti: {Report}", string.Join(", ", report.Select(kv => $"{kv.Key}={kv.Value}")));
        return report;
    }

    // Bir tablo/adım: transaction içinde; hata olursa geri alınır, -1 yazılır ve sonraki adıma geçilir
    private async Task StepAsync(Dictionary<string, int> report, string name, Func<Task<int>> step,
        CancellationToken cancellationToken)
    {
        try
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            var count = await step();
            await transaction.CommitAsync(cancellationToken);
            report[name] = report.GetValueOrDefault(name) + count;
            _logger.LogInformation("Imha: {Table} - {Count} satir", name, count);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            _context.ChangeTracker.Clear();
            report[name] = -1;
            _logger.LogError(ex, "Imha: {Table} atlandi", name);
        }
    }

    private async Task<int> PurgeSoftDeletedAsync(TableInfo table, DateTime cutoff, Dictionary<string, int> report, CancellationToken cancellationToken)
    {
        var t = Quote(table.Table);
        var purgeable = $"SELECT \"Id\" FROM {t} WHERE \"IsDeleted\" AND \"DeletedDate\" < {{0}}";

        // Kalan satırlardan nullable FK ile gösterenlerin bağı kopar (ör. canlı araç işlemi → silinecek harcama)
        foreach (var fk in table.ReferencedBy.Where(r => !r.Required))
        {
            var nulled = await _context.Database.ExecuteSqlRawAsync(
                $"UPDATE {Quote(fk.Table)} SET {Quote(fk.Column)} = NULL WHERE {Quote(fk.Column)} IN ({purgeable})",
                new object[] { cutoff }, cancellationToken);
            if (nulled > 0)
            {
                var key = $"{fk.Table}.{fk.Column} (NULL yapilan)";
                report[key] = report.GetValueOrDefault(key) + nulled;
            }
        }

        // Zorunlu FK ile hâlâ bağlı satır varsa o satır silinmez (oluşmaması gerekir; loglanır)
        var required = table.ReferencedBy.Where(r => r.Required).ToList();
        var blockedCondition = required.Count == 0
            ? "FALSE"
            : string.Join(" OR ", required.Select(fk =>
                $"EXISTS (SELECT 1 FROM {Quote(fk.Table)} c WHERE c.{Quote(fk.Column)} = p.\"Id\")"));

        var blocked = await _context.Database
            .SqlQueryRaw<int>($"SELECT count(*)::int AS \"Value\" FROM {t} p WHERE p.\"IsDeleted\" AND p.\"DeletedDate\" < {{0}} AND ({blockedCondition})", cutoff)
            .SingleAsync(cancellationToken);
        if (blocked > 0)
        {
            report[$"{table.Table} (zorunlu FK nedeniyle silinmeyen)"] = blocked;
            _logger.LogWarning("Imha: {Table} - {Count} satir zorunlu FK ile bagli oldugu icin silinmedi", table.Table, blocked);
        }

        return await _context.Database.ExecuteSqlRawAsync(
            $"DELETE FROM {t} p WHERE p.\"IsDeleted\" AND p.\"DeletedDate\" < {{0}} AND NOT ({blockedCondition})",
            new object[] { cutoff }, cancellationToken);
    }
}
