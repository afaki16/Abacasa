using Abacasa.Application.Common.Authorization;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Users.Commands.ResendAccountInvitation
{
    public class ResendAccountInvitationCommandHandler : IRequestHandler<ResendAccountInvitationCommand, Result>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ICurrentUserService _currentUserService;
        private readonly IPermissionService _permissionService;
        private readonly IAccountInvitationService _accountInvitationService;
        private readonly IJsonStringLocalizer _localizer;

        public ResendAccountInvitationCommandHandler(
            IUnitOfWork unitOfWork,
            ICurrentUserService currentUserService,
            IPermissionService permissionService,
            IAccountInvitationService accountInvitationService,
            IJsonStringLocalizer localizer)
        {
            _unitOfWork = unitOfWork;
            _currentUserService = currentUserService;
            _permissionService = permissionService;
            _accountInvitationService = accountInvitationService;
            _localizer = localizer;
        }

        public async Task<Result> Handle(ResendAccountInvitationCommand request, CancellationToken cancellationToken)
        {
            var user = await _unitOfWork.Users.GetUserWithRolesAsync(request.Id);
            if (user == null)
                return Result.Failure(Error.Failure(ErrorCode.NotFound, _localizer["users.notFound"]));

            // Same access rules as updating the user
            if (!TenantAccess.CanAccessTenant(_currentUserService, user.TenantId) ||
                TenantAdminVisibility.IsHiddenFromTenantAdmin(_currentUserService, user))
                return Result.Failure(Error.Failure(ErrorCode.Forbidden, _localizer["users.noAccessToUpdate"]));

            // Sending a set-password link to a higher-privileged user would let the caller take over that account.
            var targetRoleError = await RoleAssignmentGuard.ValidateAsync(
                user.UserRoles.Select(ur => ur.RoleId), user.TenantId, _unitOfWork, _currentUserService, _permissionService, _localizer);
            if (targetRoleError != null)
                return Result.Failure(Error.Failure(ErrorCode.Forbidden, _localizer["users.noAccessToUpdate"]));

            // Only users who have never signed in are still "invited"; others use forgot-password.
            if (user.LastLoginDate != null || user.EmailConfirmed)
                return Result.Failure(Error.Failure(ErrorCode.InvalidOperation, _localizer["users.accountInvitationNotPending"]));

            return await _accountInvitationService.SendAsync(user, cancellationToken);
        }
    }
}
