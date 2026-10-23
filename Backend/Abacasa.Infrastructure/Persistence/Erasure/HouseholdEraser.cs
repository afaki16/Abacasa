using Abacasa.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using static Abacasa.Infrastructure.Persistence.Erasure.HouseholdDataTables;

namespace Abacasa.Infrastructure.Persistence.Erasure;

// Hanenin bütün satırlarını (canlı ve silinmiş) fiziksel olarak siler; global filtre dışında (ham SQL).
// Sıra HouseholdDataTables'tan; transaction çağırana aittir.
public class HouseholdEraser : IHouseholdEraser
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<HouseholdEraser> _logger;

    public HouseholdEraser(ApplicationDbContext context, ILogger<HouseholdEraser> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IReadOnlyCollection<int>> EraseAsync(int tenantId, CancellationToken cancellationToken = default)
    {
        // İzin önbelleği temizlenecek kullanıcılar (silinmiş üyelikler dahil)
        var userIds = await _context.TenantMemberships
            .IgnoreQueryFilters()
            .Where(m => m.TenantId == tenantId)
            .Select(m => m.UserId)
            .Distinct()
            .ToListAsync(cancellationToken);

        foreach (var table in Get(_context))
        {
            var deleted = await _context.Database.ExecuteSqlRawAsync(
                $"DELETE FROM {Quote(table.Table)} WHERE \"TenantId\" = {{0}}", new object[] { tenantId }, cancellationToken);
            if (deleted > 0)
                _logger.LogInformation("Hane silme {TenantId}: {Table} {Count} satir", tenantId, table.Table, deleted);
        }

        // Hane silinince son aktif hane / oturumun hanesi boşalır (refresh başka hane seçer ya da null)
        await _context.Database.ExecuteSqlRawAsync(
            "UPDATE \"Users\" SET \"TenantId\" = NULL WHERE \"TenantId\" = {0}", new object[] { tenantId }, cancellationToken);
        await _context.Database.ExecuteSqlRawAsync(
            "UPDATE \"RefreshTokens\" SET \"TenantId\" = NULL WHERE \"TenantId\" = {0}", new object[] { tenantId }, cancellationToken);

        // Haneye özel roller ve bağları
        await _context.Database.ExecuteSqlRawAsync(
            "DELETE FROM \"UserRoles\" WHERE \"RoleId\" IN (SELECT \"Id\" FROM \"Roles\" WHERE \"TenantId\" = {0})", new object[] { tenantId }, cancellationToken);
        await _context.Database.ExecuteSqlRawAsync(
            "DELETE FROM \"RolePermissions\" WHERE \"RoleId\" IN (SELECT \"Id\" FROM \"Roles\" WHERE \"TenantId\" = {0})", new object[] { tenantId }, cancellationToken);
        await _context.Database.ExecuteSqlRawAsync(
            "DELETE FROM \"Roles\" WHERE \"TenantId\" = {0}", new object[] { tenantId }, cancellationToken);

        await _context.Database.ExecuteSqlRawAsync(
            "DELETE FROM \"Tenants\" WHERE \"Id\" = {0}", new object[] { tenantId }, cancellationToken);

        _logger.LogWarning("Hane silindi. TenantId: {TenantId}, etkilenen kullanici: {Count}", tenantId, userIds.Count);
        return userIds;
    }
}
