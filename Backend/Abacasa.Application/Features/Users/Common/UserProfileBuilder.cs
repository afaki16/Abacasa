using Abacasa.Application.Features.Auth.Common;
using Abacasa.Application.Features.Permissions.Dtos;
using Abacasa.Application.Features.Roles.Dtos;
using Abacasa.Application.Features.Users.Dtos;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Constants;
using Abacasa.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Abacasa.Application.Features.Users.Common;

// Login, refresh, hane değiştirme ve /me yanıtındaki kullanıcı nesnesi; hepsi aynı kodu kullanır.
// Roller yalnızca sistem rolleri; izinler (kullanıcı, aktif hane) ile hesaplanır; üyelikler ve aktif hane eklenir.
public static class UserProfileBuilder
{
    /// <param name="user">UserRoles.Role yüklenmiş kullanıcı</param>
    /// <param name="activeTenantId">Oturumun aktif hanesi (token'daki tenant_id)</param>
    public static async Task<UserDto> BuildAsync(IUnitOfWork unitOfWork, IPermissionService permissionService, ILegalVersions legalVersions,
        User user, int? activeTenantId)
    {
        var memberships = await unitOfWork.TenantMemberships.GetByUserReadOnlyAsync(user.Id);
        var active = activeTenantId.HasValue ? memberships.FirstOrDefault(m => m.TenantId == activeTenantId.Value) : null;

        var permissionNames = (await permissionService.GetUserPermissionsAsync(user.Id, active?.TenantId)).Value
            ?? new List<string>();
        var nameSet = new HashSet<string>(permissionNames, StringComparer.OrdinalIgnoreCase);
        var permissions = (await unitOfWork.Permissions.GetAllAsync())
            .Where(p => nameSet.Contains(p.Name))
            .OrderBy(p => p.Name)
            .Select(p => new PermissionDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Resource = p.Resource,
                Type = p.Type,
                FullPermission = p.FullPermission
            })
            .ToList();

        return new UserDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Status = user.Status,
            LastLoginDate = user.LastLoginDate,
            EmailConfirmed = user.EmailConfirmed,
            PhoneConfirmed = user.PhoneConfirmed,
            ProfileImageUrl = user.ProfileImageUrl,
            CreatedDate = user.CreatedDate,
            TenantId = user.TenantId,
            // Hane rolleri UserRole üzerinden verilmez; yalnızca sistem rolleri döner
            Roles = user.UserRoles
                .Where(ur => ur.Role != null && !IsHouseholdRole(ur.Role.Name))
                .Select(ur => new RoleDto
                {
                    Id = ur.Role.Id,
                    Name = ur.Role.Name,
                    Description = ur.Role.Description,
                    IsSystemRole = ur.Role.IsSystemRole,
                    TenantId = ur.Role.TenantId,
                    CreatedDate = ur.Role.CreatedDate
                })
                .ToList(),
            Permissions = permissions,
            ActiveTenant = active == null ? null : new UserActiveTenantDto
            {
                Id = active.TenantId,
                Name = active.Tenant.Name,
                Role = active.Role.ToString()
            },
            Memberships = memberships
                .Select(m => new UserMembershipDto { TenantId = m.TenantId, Name = m.Tenant.Name, Role = m.Role.ToString() })
                .ToList(),
            PendingConsents = await LegalConsents.GetPendingAsync(unitOfWork, legalVersions, user.Id)
        };
    }

    public static bool IsHouseholdRole(string roleName) =>
        roleName == RoleNames.HouseholdAdmin || roleName == RoleNames.HouseholdMember;
}
