using Abacasa.Application.Interfaces;

namespace Abacasa.Application.Common.Authorization
{
    /// <summary>
    /// Tenant kapsamı kontrolleri. SuperAdmin (<see cref="ICurrentUserService.CanAccessAllTenants"/>) tüm tenant'lara erişir.
    /// Diğer çağıranlar sadece kendi tenant'ına erişir; TenantId'si olmayan (null) bir çağıran tenant'a bağlı
    /// hiçbir veriye erişemez (fail closed). Aksi halde null tenant filtreyi kaldırır ve null == null eşleşmesi geçer.
    /// </summary>
    public static class TenantAccess
    {
        public static bool HasTenantScope(ICurrentUserService current) =>
            current.CanAccessAllTenants || current.TenantId.HasValue;

        public static bool CanAccessTenant(ICurrentUserService current, int? targetTenantId) =>
            current.CanAccessAllTenants || (current.TenantId.HasValue && targetTenantId == current.TenantId);
    }
}
