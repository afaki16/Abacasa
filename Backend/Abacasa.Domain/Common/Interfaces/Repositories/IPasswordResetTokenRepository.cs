using Abacasa.Domain.Entities;

namespace Abacasa.Domain.Common.Interfaces.Repositories
{
    public interface IPasswordResetTokenRepository : IRepository<PasswordResetToken, int>
    {
        Task<PasswordResetToken?> GetValidTokenAsync(string token, string email);
        Task InvalidatePreviousTokensAsync(int userId);
        Task<int> DeleteOlderThanAsync(DateTime cutoff, CancellationToken cancellationToken = default);
    }
}
