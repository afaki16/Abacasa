using System;
using System.Threading.Tasks;

namespace Abacasa.Application.Interfaces
{
    /// <summary>
    /// Her istekte access token'ın hâlâ geçerli olup olmadığını kontrol eder.
    /// </summary>
    public interface IRevokedSessionService
    {
        /// <summary>
        /// Kullanıcı yoksa, aktif değilse, oturumları token'dan sonra iptal edildiyse ya da token'daki hanede
        /// (tenantId) canlı üyeliği yoksa veya hane aktif değilse true döner. Tek sorguyla yapılır.
        /// </summary>
        Task<bool> WasSessionRevokedAfterAsync(int userId, DateTime tokenIssuedAtUtc, int? tenantId);
    }
}
