using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Entities;

namespace Abacasa.Domain.Common.Interfaces.Repositories
{
    public interface IUserVerificationTokenRepository : IRepository<UserVerificationToken, int>
    {
        Task<UserVerificationToken?> GetValidTokenAsync(
            string hashedToken,
            string destination,
            VerificationChannel channel,
            VerificationPurpose purpose);

        Task InvalidatePreviousTokensAsync(
            int userId,
            VerificationChannel channel,
            VerificationPurpose purpose);

        Task<int> DeleteOlderThanAsync(DateTime cutoff, CancellationToken cancellationToken = default);
    }
}
