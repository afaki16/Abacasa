using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;

namespace Abacasa.Infrastructure.Persistence.Erasure;

// Hesap silme ve imha işinin ortak anonimleştirmesi. Kullanıcı satırı kalır (kayıtların CreatedBy'ı ve davet eden bağı için),
// kişisel bilgiler silinir; profil fotoğrafı dosyası da silinir (IFileStorage). Transaction çağırana aittir.
public class UserAnonymizer : IUserAnonymizer
{
    public const string DeletedEmailDomain = "@deleted.invalid";

    private readonly ApplicationDbContext _context;
    private readonly IPasswordService _passwordService;
    private readonly IFileStorage _fileStorage;
    private readonly ILogger<UserAnonymizer> _logger;

    public UserAnonymizer(ApplicationDbContext context, IPasswordService passwordService, IFileStorage fileStorage,
        ILogger<UserAnonymizer> logger)
    {
        _context = context;
        _passwordService = passwordService;
        _fileStorage = fileStorage;
        _logger = logger;
    }

    public static bool IsAnonymized(string? email) => email != null && email.EndsWith(DeletedEmailDomain, StringComparison.Ordinal);

    public async Task AnonymizeAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.IgnoreQueryFilters().FirstAsync(u => u.Id == userId, cancellationToken);
        var originalEmail = user.Email;
        var now = DateTime.UtcNow;

        // Kalan üyelikler (fiziksel) ve e-postasına gönderilmiş bekleyen davetler
        await _context.Database.ExecuteSqlRawAsync(
            "DELETE FROM \"TenantMemberships\" WHERE \"UserId\" = {0}", new object[] { userId }, cancellationToken);
        await _context.Database.ExecuteSqlRawAsync(
            "DELETE FROM \"HouseholdInvitations\" WHERE \"Email\" = {0} AND \"AcceptedAt\" IS NULL AND \"RevokedAt\" IS NULL AND \"ExpiresAt\" > {1}",
            new object[] { originalEmail, now }, cancellationToken);

        // Oturum, doğrulama, sıfırlama, rol ve giriş denemesi kayıtları
        foreach (var table in new[] { "RefreshTokens", "UserVerificationTokens", "PasswordResetTokens", "UserRoles" })
            await _context.Database.ExecuteSqlRawAsync(
                $"DELETE FROM \"{table}\" WHERE \"UserId\" = {{0}}", new object[] { userId }, cancellationToken);
        await _context.Database.ExecuteSqlRawAsync(
            "DELETE FROM \"LoginAttempts\" WHERE \"Email\" = {0}", new object[] { originalEmail }, cancellationToken);

        // ConsentRecords bilerek silinmez: kullanıcı anonimleştiği için kişisel veri taşımazlar
        // (belge, sürüm ve tarih; IP/tarayıcı tutulmaz), onayın verilmiş olduğunun kaydı olarak kalırlar.

        user.FirstName = "Silinmiş";
        user.LastName = "Kullanıcı";
        user.Email = $"deleted-{user.Id}{DeletedEmailDomain}";
        user.PhoneNumber = null;
        user.PhoneConfirmed = false;
        var photoKey = user.ProfileImageKey;
        user.ProfileImageKey = null;
        user.PendingHouseholdName = null;
        // Bilinmeyen rastgele bir parolanın hash'i: hesaba artık giriş yapılamaz
        user.PasswordHash = _passwordService.HashPassword(Convert.ToHexString(RandomNumberGenerator.GetBytes(32))).Value;
        user.EmailConfirmed = false;
        user.Status = UserStatus.Inactive;
        user.TenantId = null;
        user.LastSessionsRevokedAt = now;
        user.IsDeleted = true;
        user.DeletedDate ??= now;

        await _context.SaveChangesAsync(cancellationToken);

        // Profil fotoğrafı kişisel veri: dosya da silinir. Kayıttan sonra; silme hatası yalnızca loglanır (dosya kalır,
        // anahtar null olduğu için hiçbir yerden gösterilmez). Transaction sonradan geri alınırsa anahtar geri döner ama
        // dosya yoktur; arayüz baş harfleri gösterir, sonraki anonimleştirme anahtarı temizler.
        if (!string.IsNullOrEmpty(photoKey))
        {
            try
            {
                await _fileStorage.DeleteAsync(photoKey, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Anonimlestirmede profil fotografi silinemedi. UserId: {UserId}, Key: {Key}", userId, photoKey);
            }
        }

        _logger.LogWarning("Kullanici anonimlestirildi. UserId: {UserId}", userId);
    }
}
