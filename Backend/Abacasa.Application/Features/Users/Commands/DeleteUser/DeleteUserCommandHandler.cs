using Abacasa.Application.Features.Users.Commands.CreateUser;
using Abacasa.Application.Features.Users.Commands.UpdateUser;
using Abacasa.Application.Features.Users.Commands.DeleteUser;
using Abacasa.Application.Common.Authorization;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Users.Dtos;
using Abacasa.Application.Features.Roles.Dtos;
using Abacasa.Application.Features.Tenants.Dtos;
using Abacasa.Application.Features.Permissions.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Constants;
using Abacasa.Domain.Models;
using MediatR;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Abacasa.Application.Features.Users.Commands.DeleteUser
{
    public class DeleteUserCommandHandler : IRequestHandler<DeleteUserCommand, Result>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ICurrentUserService _currentUserService;
        private readonly IPermissionService _permissionService;
        private readonly ILogger<DeleteUserCommandHandler> _logger;
        private readonly IJsonStringLocalizer _localizer;

        public DeleteUserCommandHandler(
            IUnitOfWork unitOfWork,
            ICurrentUserService currentUserService,
            IPermissionService permissionService,
            ILogger<DeleteUserCommandHandler> logger,
            IJsonStringLocalizer localizer)
        {
            _unitOfWork = unitOfWork;
            _currentUserService = currentUserService;
            _permissionService = permissionService;
            _logger = logger;
            _localizer = localizer;
        }

        public async Task<Result> Handle(DeleteUserCommand request, CancellationToken cancellationToken)
        {
            var user = await _unitOfWork.Users.GetUserWithRolesAsync(request.Id);

            if (user == null)
                return Result.Failure(Error.Failure(
                    ErrorCode.NotFound,
                    _localizer["users.notFound"]));

            // Prevent self-deletion
            if (user.Id == _currentUserService.UserId)
            {
                _logger.LogWarning(
                    "Self-deletion attempt blocked. UserId: {UserId}",
                    _currentUserService.UserId);
                return Result.Failure(Error.Failure(
                    ErrorCode.Forbidden,
                    _localizer["users.cannotDeleteSelf"]));
            }

            // Admin/User can only delete users from their own tenant; SuperAdmin can delete any user
            if (!TenantAccess.CanAccessTenant(_currentUserService, user.TenantId))
                return Result.Failure(Error.Failure(
                    ErrorCode.Forbidden,
                    _localizer["users.noAccessToDelete"]));

            if (TenantAdminVisibility.IsHiddenFromTenantAdmin(_currentUserService, user))
                return Result.Failure(Error.Failure(
                    ErrorCode.Forbidden,
                    _localizer["users.noAccessToDelete"]));

            // Caller cannot delete a user whose roles exceed the caller's own permissions
            var targetRoleError = await RoleAssignmentGuard.ValidateAsync(
                user.UserRoles.Select(ur => ur.RoleId), user.TenantId, _unitOfWork, _currentUserService, _permissionService, _localizer);
            if (targetRoleError != null)
                return Result.Failure(Error.Failure(
                    ErrorCode.Forbidden,
                    _localizer["users.noAccessToDelete"]));

            // Last SuperAdmin protection
            var isSuperAdmin = user.UserRoles?.Any(ur => ur.Role?.Name == RoleNames.SuperAdmin) == true;
            if (isSuperAdmin)
            {
                var activeSuperAdminCount = await _unitOfWork.Users.CountActiveSuperAdminsAsync();
                if (activeSuperAdminCount <= 1)
                {
                    _logger.LogWarning(
                        "Last SuperAdmin deletion attempt blocked. AdminId: {AdminId}, " +
                        "TargetUserId: {TargetUserId}",
                        _currentUserService.UserId, request.Id);
                    return Result.Failure(Error.Failure(
                        ErrorCode.Forbidden,
                        _localizer["users.cannotDeleteLastSuperAdmin"]));
                }
            }

            _unitOfWork.Users.SoftDelete(user);

            // Revoke all active sessions for the deleted user
            user.LastSessionsRevokedAt = DateTime.UtcNow;
            await _unitOfWork.RefreshTokens.RevokeAllUserTokensAsync(
                user.Id,
                ipAddress: null,
                userAgent: null,
                reason: "User account deleted");

            await _unitOfWork.SaveChangesAsync();

            _permissionService.ClearUserPermissionCache(request.Id);

            _logger.LogWarning(
                "User deleted by admin. AdminId: {AdminId}, DeletedUserId: {DeletedUserId}, " +
                "DeletedEmail: {DeletedEmail}",
                _currentUserService.UserId, request.Id, user.Email);

            return Result.Success();
        }
    }
} 
