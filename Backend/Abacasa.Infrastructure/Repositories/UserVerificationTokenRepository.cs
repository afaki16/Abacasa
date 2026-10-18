using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Domain.Entities;
using Abacasa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Abacasa.Infrastructure.Repositories
{
    public class UserVerificationTokenRepository
        : RepositoryBase<UserVerificationToken, int>, IUserVerificationTokenRepository
    {
        public UserVerificationTokenRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<UserVerificationToken?> GetValidTokenAsync(
            string hashedToken,
            string destination,
            VerificationChannel channel,
            VerificationPurpose purpose)
        {
            return await GetQueryable()
                .Include(t => t.User)
                .FirstOrDefaultAsync(t =>
                    t.Token == hashedToken &&
                    t.Destination == destination &&
                    t.Channel == channel &&
                    t.Purpose == purpose &&
                    !t.IsUsed &&
                    t.ExpiresAt > DateTime.UtcNow);
        }

        public async Task InvalidatePreviousTokensAsync(
            int userId,
            VerificationChannel channel,
            VerificationPurpose purpose)
        {
            var activeTokens = await GetQueryable()
                .Where(t =>
                    t.UserId == userId &&
                    t.Channel == channel &&
                    t.Purpose == purpose &&
                    !t.IsUsed &&
                    t.ExpiresAt > DateTime.UtcNow)
                .ToListAsync();

            foreach (var token in activeTokens)
                token.MarkAsUsed();

            UpdateRange(activeTokens);
        }

        public async Task<int> DeleteOlderThanAsync(DateTime cutoff, CancellationToken cancellationToken = default)
        {
            return await _context.Set<UserVerificationToken>()
                .IgnoreQueryFilters()
                .Where(t => t.ExpiresAt < cutoff)
                .ExecuteDeleteAsync(cancellationToken);
        }
    }
}
