using AutoMapper;
using Abacasa.Application.Features.Users.Dtos;
using Abacasa.Application.Features.Roles.Dtos;
using Abacasa.Application.Features.Tenants.Dtos;
using Abacasa.Application.Features.Permissions.Dtos;
using Abacasa.Application.Features.Roles.Commands.CreateRole;
using Abacasa.Application.Features.Roles.Commands.UpdateRole;
using Abacasa.Application.Features.Roles.Commands.DeleteRole;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Application.Common.Results;
using Abacasa.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Abacasa.Domain.Models;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Constants;

namespace Abacasa.Application.Features.Roles.Commands.CreateRole
{
    public class CreateRoleCommandHandler : IRequestHandler<CreateRoleCommand, Result<RoleDto>>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ILogger<CreateRoleCommandHandler> _logger;
        private readonly IJsonStringLocalizer _localizer;
        private readonly IPermissionService _permissionService;
        private readonly ICurrentUserService _currentUserService;

        public CreateRoleCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, ILogger<CreateRoleCommandHandler> logger, IJsonStringLocalizer localizer, IPermissionService permissionService, ICurrentUserService currentUserService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _logger = logger;
            _localizer = localizer;
            _permissionService = permissionService;
            _currentUserService = currentUserService;
        }

        public async Task<Result<RoleDto>> Handle(CreateRoleCommand request, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation($"Creating new role: {request.Name}");

                // SuperAdmin creates common roles (TenantId null); everyone else creates roles in their own tenant
                var isSuperAdmin = _currentUserService.CanAccessAllTenants;
                int? tenantId = isSuperAdmin ? null : _currentUserService.TenantId;

                if (!isSuperAdmin && tenantId == null)
                    return Result<RoleDto>.Failure(Error.Failure(
                        ErrorCode.Forbidden,
                        _localizer["auth.forbidden"]));

                var name = request.Name.Trim();

                if (tenantId != null && RoleNames.Reserved.Contains(name, StringComparer.OrdinalIgnoreCase))
                    return Result<RoleDto>.Failure(Error.Failure(
                        ErrorCode.AlreadyExists,
                        _localizer["roles.nameReserved"]));

                // Check if role name already exists
                if (await _unitOfWork.Roles.RoleNameExistsAsync(name, tenantId))
                return Result<RoleDto>.Failure(Error.Failure(
                  ErrorCode.AlreadyExists,
                  _localizer["roles.nameExists"]));

                var permissions = request.PermissionIds?.Any() == true
                    ? (await _unitOfWork.Permissions.FindAsync(p => request.PermissionIds.Contains(p.Id))).ToList()
                    : new List<Permission>();

                // Caller cannot grant a permission they do not have
                if (!isSuperAdmin)
                {
                    if (_currentUserService.UserId is not int callerId)
                        return Result<RoleDto>.Failure(Error.Failure(
                            ErrorCode.Unauthorized,
                            _localizer["auth.userNotAuthenticated"]));

                    var permissionsResult = await _permissionService.GetUserPermissionsAsync(callerId, _currentUserService.TenantId);
                    if (!permissionsResult.IsSuccess)
                        return Result<RoleDto>.Failure(permissionsResult.Errors);

                    var callerPermissions = new HashSet<string>(permissionsResult.Value, StringComparer.OrdinalIgnoreCase);
                    if (permissions.Any(p => !callerPermissions.Contains(p.Name)))
                        return Result<RoleDto>.Failure(Error.Failure(
                            ErrorCode.Forbidden,
                            _localizer["roles.cannotGrantPermission"]));
                }

                // Create role and assign permissions in a single transaction
                var role = new Role
                {
                    Name = name,
                    Description = request.Description,
                    IsSystemRole = false,
                    TenantId = tenantId
                };

                await _unitOfWork.Roles.AddAsync(role);
                await _unitOfWork.SaveChangesAsync();

                _logger.LogInformation($"Created role with ID: {role.Id}");

                // Assign permissions to role if provided
                if (permissions.Any())
                {
                    _logger.LogInformation($"Adding {request.PermissionIds.Count()} permissions to new role. Permission IDs: {string.Join(", ", request.PermissionIds)}");

                    foreach (var permission in permissions)
                    {
                        var rolePermission = new RolePermission
                        {
                            RoleId = role.Id,
                            PermissionId = permission.Id,
                            CreatedDate = DateTime.UtcNow,
                            IsDeleted = false
                        };
                        await _unitOfWork.Roles.AddRolePermissionAsync(rolePermission);
                    }

                    await _unitOfWork.SaveChangesAsync();
                    _logger.LogInformation($"Saved {permissions.Count()} role permissions to database");
                }

                _permissionService.ClearRolePermissionCache();

                // Get role with permissions for mapping
                var roleWithPermissions = await _unitOfWork.Roles.GetRoleWithPermissionsAsync(role.Id);
                _logger.LogInformation($"Retrieved role with {roleWithPermissions?.RolePermissions?.Count ?? 0} permissions");
                
                var roleDto = _mapper.Map<RoleDto>(roleWithPermissions);
                _logger.LogInformation($"Mapped role DTO with {roleDto?.Permissions?.Count ?? 0} permissions");
                
                _logger.LogInformation($"Successfully created role: {role.Name}");
                return Result<RoleDto>.Success(roleDto);
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Error occurred while creating role: {RoleName}", request.Name);
                return Result<RoleDto>.Failure(Error.Failure(
                    ErrorCode.InternalError,
                    _localizer["roles.createFailed"]));
            }
        }
    }
} 
