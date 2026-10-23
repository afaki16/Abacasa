using AutoMapper;
using Abacasa.Application.Interfaces;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Features.Roles.Commands.CreateRole;
using Abacasa.Application.Features.Roles.Commands.UpdateRole;
using Abacasa.Application.Features.Roles.Commands.DeleteRole;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Application.Common.Results;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Constants;
using MediatR;
using Microsoft.Extensions.Logging;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Abacasa.Application.Features.Users.Dtos;
using Abacasa.Application.Features.Roles.Dtos;
using Abacasa.Application.Features.Tenants.Dtos;
using Abacasa.Application.Features.Permissions.Dtos;

namespace Abacasa.Application.Features.Roles.Commands.UpdateRole
{
    public class UpdateRoleCommandHandler : IRequestHandler<UpdateRoleCommand, Result<RoleDto>>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ILogger<UpdateRoleCommandHandler> _logger;
        private readonly IPermissionService _permissionService;
        private readonly IJsonStringLocalizer _localizer;
        private readonly ICurrentUserService _currentUserService;

        public UpdateRoleCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, ILogger<UpdateRoleCommandHandler> logger, IPermissionService permissionService, IJsonStringLocalizer localizer, ICurrentUserService currentUserService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _logger = logger;
            _permissionService = permissionService;
            _localizer = localizer;
            _currentUserService = currentUserService;
        }

        public async Task<Result<RoleDto>> Handle(UpdateRoleCommand request, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation($"Updating role with ID: {request.Id}");

                var role = await _unitOfWork.Roles.GetRoleWithPermissionsAsync(request.Id);

                if (role == null)
                return Result<RoleDto>.Failure(Error.Failure(
                  ErrorCode.NotFound,
                  _localizer["roles.notFound"]));

                if (role.IsSystemRole)
                return Result<RoleDto>.Failure(Error.Failure(
                ErrorCode.InvalidOperation,
                _localizer["roles.cannotModifySystem"]));

                var isSuperAdmin = _currentUserService.CanAccessAllTenants;
                HashSet<string>? callerPermissions = null;

                if (!isSuperAdmin)
                {
                    // Common roles are managed by SuperAdmin only; other tenants' roles look like they do not exist
                    if (role.TenantId == null)
                        return Result<RoleDto>.Failure(Error.Failure(
                            ErrorCode.Forbidden,
                            _localizer["roles.cannotModifySystem"]));

                    if (role.TenantId != _currentUserService.TenantId)
                        return Result<RoleDto>.Failure(Error.Failure(
                            ErrorCode.NotFound,
                            _localizer["roles.notFound"]));

                    if (_currentUserService.UserId is not int callerId)
                        return Result<RoleDto>.Failure(Error.Failure(
                            ErrorCode.Unauthorized,
                            _localizer["auth.userNotAuthenticated"]));

                    var permissionsResult = await _permissionService.GetUserPermissionsAsync(callerId, _currentUserService.TenantId);
                    if (!permissionsResult.IsSuccess)
                        return Result<RoleDto>.Failure(permissionsResult.Errors);

                    callerPermissions = new HashSet<string>(permissionsResult.Value, StringComparer.OrdinalIgnoreCase);

                    // Caller cannot modify a role that already has permissions beyond their own
                    if (role.RolePermissions.Any(rp => !callerPermissions.Contains(rp.Permission.Name)))
                        return Result<RoleDto>.Failure(Error.Failure(
                            ErrorCode.Forbidden,
                            _localizer["roles.noAccessToModify"]));
                }

                var name = request.Name.Trim();

                if (role.TenantId != null && RoleNames.Reserved.Contains(name, StringComparer.OrdinalIgnoreCase))
                    return Result<RoleDto>.Failure(Error.Failure(
                        ErrorCode.AlreadyExists,
                        _localizer["roles.nameReserved"]));

                // Check if role name already exists for another role
                if (await _unitOfWork.Roles.RoleNameExistsAsync(name, role.TenantId, excludeRoleId: role.Id))
                return Result<RoleDto>.Failure(Error.Failure(
                                ErrorCode.AlreadyExists,
                                _localizer["roles.nameExists"]));

                var permissions = request.PermissionIds?.Any() == true
                    ? (await _unitOfWork.Permissions.FindAsync(p => request.PermissionIds.Contains(p.Id))).ToList()
                    : new List<Permission>();

                // Caller cannot grant a permission they do not have
                if (callerPermissions != null && permissions.Any(p => !callerPermissions.Contains(p.Name)))
                    return Result<RoleDto>.Failure(Error.Failure(
                        ErrorCode.Forbidden,
                        _localizer["roles.cannotGrantPermission"]));


            // Update role properties
            role.Name = name;
                role.Description = request.Description;

                _unitOfWork.Roles.Update(role);

                // Clear existing permissions
                var existingRolePermissions = role.RolePermissions.ToList();
                foreach (var rolePermission in existingRolePermissions)
                {
                    _unitOfWork.Roles.RemoveRolePermission(rolePermission);
                }

                // Add new permissions if provided
                if (permissions.Any())
                {
                    _logger.LogInformation($"Adding {request.PermissionIds.Count()} permissions to role");

                    foreach (var permission in permissions)
                    {
                        var rolePermission = new RolePermission
                        {
                            RoleId = role.Id,
                            PermissionId = permission.Id
                        };
                        await _unitOfWork.Roles.AddRolePermissionAsync(rolePermission);
                    }
                }

                await _unitOfWork.SaveChangesAsync();

                _permissionService.ClearRolePermissionCache();
                var affectedUserIds = await _unitOfWork.Users.GetUserIdsByRoleIdAsync(request.Id);
                foreach (var userId in affectedUserIds)
                    _permissionService.ClearUserPermissionCache(userId);

                // Get updated role with permissions
                var updatedRole = await _unitOfWork.Roles.GetRoleWithPermissionsAsync(role.Id);
                var roleDto = _mapper.Map<RoleDto>(updatedRole);
                
                _logger.LogInformation($"Successfully updated role: {role.Name}");
                return Result<RoleDto>.Success(roleDto);
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating role with ID: {RoleId}", request.Id);
                return Result<RoleDto>.Failure(Error.Failure(
                    ErrorCode.InternalError,
                    _localizer["roles.updateFailed"]));
        }
        }
    }
} 
