using System;
using System.Threading.Tasks;

namespace Abacasa.Application.Interfaces
{
    /// <summary>
    /// Her istekteki oturum kontrolünün sonucu.
    /// </summary>
    /// <param name="IsRevoked">Access token reddedilmeli.</param>
    /// <param name="MustChangePassword">Kullanıcı API'yi kullanmadan önce şifresini değiştirmeli.</param>
    public readonly record struct SessionCheckResult(bool IsRevoked, bool MustChangePassword);

    /// <summary>
    /// Her istekte access token'ın hâlâ geçerli olup olmadığını kontrol eder.
    /// </summary>
    public interface IRevokedSessionService
    {
        /// <summary>
        /// Kullanıcı yoksa, aktif değilse, oturumları token'dan sonra iptal edildiyse ya da token'daki hanede
        /// (tenantId) canlı üyeliği yoksa veya hane aktif değilse IsRevoked = true döner. Ayrıca kullanıcının
        /// zorunlu şifre değişimi bayrağını döndürür. Tek sorguyla yapılır.
        /// </summary>
        Task<SessionCheckResult> CheckSessionAsync(int userId, DateTime tokenIssuedAtUtc, int? tenantId);
    }
}
