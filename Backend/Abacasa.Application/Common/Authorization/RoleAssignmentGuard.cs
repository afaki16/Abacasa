using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Constants;
using Abacasa.Domain.Models;

namespace Abacasa.Application.Common.Authorization
{
    /// <summary>
    /// SuperAdmin olmayan çağıran, kendi izinlerini aşan bir rolü atayamaz / bu rollere sahip kullanıcıyı yönetemez.
    /// Tenant rolü yalnızca o tenant'ın kullanıcısına ait olabilir; bu kontrol SuperAdmin
    /// (<see cref="ICurrentUserService.CanAccessAllTenants"/>) için de uygulanır, diğer kontroller uygulanmaz.
    /// </summary>
    public static class RoleAssignmentGuard
    {
        /// <returns>Geçerse null, geçmezse ilgili <see cref="Error"/>.</returns>
        public static async Task<Error?> ValidateAsync(
            IEnumerable<int> roleIds,
            int? targetTenantId,
            IUnitOfWork unitOfWork,
            ICurrentUserService currentUserService,
            IPermissionService permissionService,
            IJsonStringLocalizer localizer)
        {
            if (roleIds?.Any() != true)
                return null;

            var isSuperAdmin = currentUserService.CanAccessAllTenants;
            HashSet<string>? callerPermissions = null;

            if (!isSuperAdmin)
            {
                if (currentUserService.UserId is not int callerId)
                    return Error.Failure(ErrorCode.Unauthorized, localizer["auth.userNotAuthenticated"]);

                var permissionsResult = await permissionService.GetUserPermissionsAsync(callerId, currentUserService.TenantId);
                if (!permissionsResult.IsSuccess)
                    return permissionsResult.Errors[0];

                callerPermissions = new HashSet<string>(permissionsResult.Value, StringComparer.OrdinalIgnoreCase);
            }

            foreach (var roleId in roleIds.Distinct())
            {
                var role = await unitOfWork.Roles.GetRoleWithPermissionsReadOnlyAsync(roleId);

                if (role == null)
                    return Error.Failure(ErrorCode.NotFound, localizer["roles.notFound"]);

                // A tenant role can only belong to users of that tenant (applies to SuperAdmin too)
                if (role.TenantId != null && role.TenantId != targetTenantId)
                    return Error.Failure(ErrorCode.NotFound, localizer["roles.notFound"]);

                if (isSuperAdmin)
                    continue;

                if (role.Name == RoleNames.SuperAdmin)
                    return Error.Failure(ErrorCode.Forbidden, localizer["users.cannotAssignSuperAdmin"]);

                if (role.RolePermissions.Any(rp => !callerPermissions!.Contains(rp.Permission.Name)))
                    return Error.Failure(ErrorCode.Forbidden, localizer["users.cannotAssignRole"]);
            }

            return null;
        }
    }
}
