using System.Linq;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Constants;
using Abacasa.Domain.Entities;

namespace Abacasa.Application.Common.Authorization
{
    /// <summary>
    /// Tenant Admin, kendi tenant'ında bile SuperAdmin rolündeki kullanıcıları görmemeli / yönetmemeli.
    /// SuperAdmin (<see cref="ICurrentUserService.CanAccessAllTenants"/>) tüm kullanıcılara erişir.
    /// </summary>
    public static class TenantAdminVisibility
    {
        public static bool UserHasSuperAdminRole(User user) =>
            user?.UserRoles?.Any(ur => ur.Role?.Name == RoleNames.SuperAdmin) == true;

        public static bool IsHiddenFromTenantAdmin(ICurrentUserService current, User user) =>
            !current.CanAccessAllTenants && UserHasSuperAdminRole(user);
    }
}
