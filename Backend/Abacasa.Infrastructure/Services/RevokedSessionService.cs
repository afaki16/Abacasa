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

        // Treats the session as revoked when the user no longer exists, is not Active, belongs to an
        // inactive or deleted tenant, or had all sessions revoked after the token was issued.
        public async Task<bool> WasSessionRevokedAfterAsync(int userId, DateTime tokenIssuedAtUtc)
        {
            var state = await _unitOfWork.Users.GetSessionStateAsync(userId);
            if (state == null) return true; // User not found, treat as revoked

            var (lastSessionsRevokedAt, status, _, tenantOk) = state.Value;

            if (status != UserStatus.Active || !tenantOk)
                return true;

            return lastSessionsRevokedAt.HasValue && lastSessionsRevokedAt.Value > tokenIssuedAtUtc;
        }
    }
}
