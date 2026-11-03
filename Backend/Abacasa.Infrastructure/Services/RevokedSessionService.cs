using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using System;
using System.Threading.Tasks;

namespace Abacasa.Infrastructure.Services
{
    public class RevokedSessionService : IRevokedSessionService
    {
        private readonly IUnitOfWork _unitOfWork;

        public RevokedSessionService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        // Treats the session as revoked when the user no longer exists, is not Active, had all sessions revoked
        // after the token was issued, or has no live membership in the token's tenant (or that tenant is inactive/deleted).
        // Kullanıcı ve hane kontrolleri tek sorguda yapılır.
        public async Task<SessionCheckResult> CheckSessionAsync(int userId, DateTime tokenIssuedAtUtc, int? tenantId)
        {
            var state = await _unitOfWork.Users.GetSessionStateAsync(userId, tenantId);
            if (state == null) return new SessionCheckResult(IsRevoked: true, MustChangePassword: false); // User not found, treat as revoked

            var (lastSessionsRevokedAt, status, tenantOk, mustChangePassword) = state.Value;

            var isRevoked = status != UserStatus.Active
                || !tenantOk
                || (lastSessionsRevokedAt.HasValue && lastSessionsRevokedAt.Value > tokenIssuedAtUtc);

            return new SessionCheckResult(isRevoked, mustChangePassword);
        }
    }
}
