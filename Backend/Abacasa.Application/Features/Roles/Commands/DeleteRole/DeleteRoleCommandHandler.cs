using Abacasa.Application.Common.Results;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Features.Roles.Dtos;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;


namespace Abacasa.Application.Features.Roles.Commands.DeleteRole
{

    public class DeleteRoleCommandHandler : IRequestHandler<DeleteRoleCommand, Result>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPermissionService _permissionService;
        private readonly IJsonStringLocalizer _localizer;
        private readonly ICurrentUserService _currentUserService;

        public DeleteRoleCommandHandler(IUnitOfWork unitOfWork, IPermissionService permissionService, IJsonStringLocalizer localizer, ICurrentUserService currentUserService)
        {
            _unitOfWork = unitOfWork;
            _permissionService = permissionService;
            _localizer = localizer;
            _currentUserService = currentUserService;
        }

        public async Task<Result> Handle(DeleteRoleCommand request, CancellationToken cancellationToken)
        {
            // Read-only load for the checks; SoftDelete calls Update(), which would also mark the
            // included RolePermissions/Permissions as modified, so the delete uses a plain tracked load.
            var roleWithPermissions = await _unitOfWork.Roles.GetRoleWithPermissionsReadOnlyAsync(request.Id);

            if (roleWithPermissions == null)
                return Result<RoleDto>.Failure(Error.Failure(
                    ErrorCode.NotFound,
                    _localizer["roles.notFound"]));

            if (roleWithPermissions.IsSystemRole)
                return Result<RoleDto>.Failure(Error.Failure(
                    ErrorCode.InvalidOperation,
                    _localizer["roles.cannotModifySystem"]));

            if (!_currentUserService.CanAccessAllTenants)
            {
                // Common roles are managed by SuperAdmin only; other tenants' roles look like they do not exist
                if (roleWithPermissions.TenantId == null)
                    return Result.Failure(Error.Failure(
                        ErrorCode.Forbidden,
                        _localizer["roles.cannotModifySystem"]));

                if (roleWithPermissions.TenantId != _currentUserService.TenantId)
                    return Result.Failure(Error.Failure(
                        ErrorCode.NotFound,
                        _localizer["roles.notFound"]));

                if (_currentUserService.UserId is not int callerId)
                    return Result.Failure(Error.Failure(
                        ErrorCode.Unauthorized,
                        _localizer["auth.userNotAuthenticated"]));

                var permissionsResult = await _permissionService.GetUserPermissionsAsync(callerId, _currentUserService.TenantId);
                if (!permissionsResult.IsSuccess)
                    return Result.Failure(permissionsResult.Errors);

                // Caller cannot delete a role that has permissions beyond their own
                var callerPermissions = new HashSet<string>(permissionsResult.Value, StringComparer.OrdinalIgnoreCase);
                if (roleWithPermissions.RolePermissions.Any(rp => !callerPermissions.Contains(rp.Permission.Name)))
                    return Result.Failure(Error.Failure(
                        ErrorCode.Forbidden,
                        _localizer["roles.noAccessToModify"]));
            }

            var role = await _unitOfWork.Roles.GetByIdAsync(request.Id);

            if (role == null)
                return Result.Failure(Error.Failure(
                    ErrorCode.NotFound,
                    _localizer["roles.notFound"]));

            // Collect affected users BEFORE delete so we can invalidate their cached
            // permission lists after the role is removed.
            var affectedUserIds = await _unitOfWork.Users.GetUserIdsByRoleIdAsync(request.Id);

            _unitOfWork.Roles.SoftDelete(role);
            await _unitOfWork.SaveChangesAsync();

            // Drop the role->permissions map (the deleted role is still in it).
            _permissionService.ClearRolePermissionCache();

            // Drop the per-user cache for everyone who had this role assigned.
            foreach (var userId in affectedUserIds)
                _permissionService.ClearUserPermissionCache(userId);

            return Result.Success();
        }
    }
} 
