using AutoMapper;
using Kickstart.Application.Features.Users.Dtos;
using Kickstart.Application.Features.Roles.Dtos;
using Kickstart.Application.Features.Tenants.Dtos;
using Kickstart.Application.Features.Permissions.Dtos;
using Kickstart.Application.Features.Users.Commands.CreateUser;
using Kickstart.Application.Features.Users.Commands.UpdateUser;
using Kickstart.Application.Features.Users.Commands.DeleteUser;
using Kickstart.Application.Common.Authorization;
using Kickstart.Application.Common.Localization;
using Kickstart.Application.Interfaces;
using Kickstart.Domain.Common.Interfaces;
using Kickstart.Domain.Common.Interfaces.Repositories;
using Kickstart.Application.Common.Results;
using Kickstart.Domain.Entities;
using Kickstart.Domain.Models;
using Kickstart.Domain.Common.Enums;
using Kickstart.Domain.Constants;
using MediatR;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Kickstart.Application.Features.Users.Commands.UpdateUser
{
    public class UpdateUserCommandHandler : IRequestHandler<UpdateUserCommand, Result<Application.Features.Users.Dtos.UserListDto>>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ICurrentUserService _currentUserService;
        private readonly IPermissionService _permissionService;
        private readonly IJsonStringLocalizer _localizer;

        public UpdateUserCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, ICurrentUserService currentUserService, IPermissionService permissionService, IJsonStringLocalizer localizer)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _currentUserService = currentUserService;
            _permissionService = permissionService;
            _localizer = localizer;
        }

        public async Task<Result<UserListDto>> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
        {
            var user = await _unitOfWork.Users.GetUserWithRolesAsync(request.Id);

            if (user == null)
                return Result<UserListDto>.Failure(Error.Failure(
                    ErrorCode.NotFound,
                    _localizer["users.notFound"]));

            // Admin/User can only update users from their own tenant; SuperAdmin can update any user
            if (!TenantAccess.CanAccessTenant(_currentUserService, user.TenantId))
                return Result<UserListDto>.Failure(Error.Failure(
                    ErrorCode.Forbidden,
                    _localizer["users.noAccessToUpdate"]));

            if (TenantAdminVisibility.IsHiddenFromTenantAdmin(_currentUserService, user))
                return Result<UserListDto>.Failure(Error.Failure(
                    ErrorCode.Forbidden,
                    _localizer["users.noAccessToUpdate"]));

            if (request.Id == _currentUserService.UserId && request.Status != user.Status)
                return Result<UserListDto>.Failure(Error.Failure(
                    ErrorCode.Forbidden,
                    _localizer["users.cannotChangeOwnStatus"]));

            // Caller cannot manage a user whose roles exceed the caller's own permissions
            var targetRoleError = await RoleAssignmentGuard.ValidateAsync(
                user.UserRoles.Select(ur => ur.RoleId), user.TenantId, _unitOfWork, _currentUserService, _permissionService, _localizer);
            if (targetRoleError != null)
                return Result<UserListDto>.Failure(Error.Failure(
                    ErrorCode.Forbidden,
                    _localizer["users.noAccessToUpdate"]));

            var roleError = await RoleAssignmentGuard.ValidateAsync(
                request.RoleIds, user.TenantId, _unitOfWork, _currentUserService, _permissionService, _localizer);
            if (roleError != null)
                return Result<UserListDto>.Failure(roleError);

            var normalizedEmail = request.Email?.Trim().ToLowerInvariant();

            // Check if email already exists for another user in the same tenant
        var existingUser = await _unitOfWork.Users.GetByEmailAsync(normalizedEmail, user.TenantId);
            if (existingUser != null && existingUser.Id != request.Id)
            return Result<UserListDto>.Failure(Error.Failure(
                        ErrorCode.AlreadyExists,
                        _localizer["users.emailExists"]));

            if (!string.IsNullOrWhiteSpace(request.PhoneNumber) &&
                await _unitOfWork.Users.PhoneExistsAsync(request.PhoneNumber, user.TenantId, request.Id))
                return Result<UserListDto>.Failure(Error.Failure(
                    ErrorCode.AlreadyExists,
                    _localizer["users.phoneExists"]));

            var isDeactivated = user.Status == UserStatus.Active && request.Status != UserStatus.Active;
            var rolesChanged = !user.UserRoles.Select(ur => ur.RoleId).ToHashSet()
                .SetEquals(request.RoleIds ?? new List<int>());

            // Update user properties
            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.Email = normalizedEmail;
            user.PhoneNumber = request.PhoneNumber;
            user.Status = request.Status;
            user.ProfileImageUrl = request.ProfileImageUrl;

            // Clear existing roles using already-loaded navigation property
            foreach (var userRole in user.UserRoles.ToList())
                _unitOfWork.Users.RemoveUserRole(userRole);

            // Add new roles if provided
            if (request.RoleIds?.Any() == true)
            {
                foreach (var roleId in request.RoleIds)
                    await _unitOfWork.Users.AddUserRoleAsync(new UserRole { UserId = user.Id, RoleId = roleId });
            }

            if (isDeactivated)
            {
                user.LastSessionsRevokedAt = DateTime.UtcNow;
            }
            else if (rolesChanged)
            {
                // Role claims (Admin/SuperAdmin) live in the access token; reject tokens issued before this change.
                // The refresh flow ignores LastSessionsRevokedAt, so the client silently refreshes with the new roles.
                // Truncated to whole seconds because the token's iat is: otherwise a token refreshed within the same
                // second would also be rejected. Cost: a token issued in that same second before the change stays
                // valid until it expires.
                var now = DateTime.UtcNow;
                user.LastSessionsRevokedAt = new DateTime(now.Ticks - now.Ticks % TimeSpan.TicksPerSecond, DateTimeKind.Utc);
            }

            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();

            // Runs immediately (ExecuteUpdate), so only after the status change is saved
            if (isDeactivated)
                await _unitOfWork.RefreshTokens.RevokeAllUserTokensAsync(user.Id, reason: "User deactivated");

            _permissionService.ClearUserPermissionCache(request.Id);

            var updatedUser = await _unitOfWork.Users.GetUserWithRolesAsync(user.Id);
            var userDto = _mapper.Map<UserListDto>(updatedUser);
            return Result<UserListDto>.Success(userDto);
        }
    }
} 
