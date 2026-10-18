using Abacasa.Application.Common.Authorization;
using Abacasa.Application.Interfaces;
using Abacasa.Application.Common.Results;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Domain.Models;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Abacasa.Application.Features.Admin.Commands.RevokeUserSessions
{
    public class RevokeUserSessionsCommandHandler : IRequestHandler<RevokeUserSessionsCommand, Result>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ICurrentUserService _currentUserService;

        public RevokeUserSessionsCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
        {
            _unitOfWork = unitOfWork;
            _currentUserService = currentUserService;
        }

        public async Task<Result> Handle(RevokeUserSessionsCommand request, CancellationToken cancellationToken)
        {
            var user = await _unitOfWork.Users.GetUserWithRolesAsync(request.UserId);
            if (user == null)
                return Result.Failure(Error.Failure(ErrorCode.NotFound, "User not found"));

            // Admin can only revoke users in their own tenant. SuperAdmin can revoke any user.
            if (!TenantAccess.CanAccessTenant(_currentUserService, user.TenantId))
                return Result.Failure(Error.Failure(ErrorCode.Forbidden, "You can only revoke sessions for users in your own tenant"));

            if (TenantAdminVisibility.IsHiddenFromTenantAdmin(_currentUserService, user))
                return Result.Failure(Error.Failure(ErrorCode.Forbidden, "You cannot revoke sessions for this user"));

            var reason = request.Reason ?? "Session revoked by admin";
            await _unitOfWork.RefreshTokens.RevokeAllUserTokensAsync(
                request.UserId,
                ipAddress: null,
                userAgent: null,
                reason: reason);

            // Mark sessions as revoked - access tokens issued before this time will be rejected
            user.LastSessionsRevokedAt = DateTime.UtcNow;
            _unitOfWork.Users.Update(user);

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return Result.Success();
        }
    }
}
