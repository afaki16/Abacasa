using Abacasa.Application.Common.Results;

namespace Abacasa.Application.Interfaces
{
    /// <summary>
    /// İzinler (kullanıcı, aktif hane) ile hesaplanır; tenantId token'daki tenant_id'dir:
    /// (sistem rollerinin izinleri ∩ sistem kaynakları) ∪ (aktif hanedeki canlı üyeliğin rol izinleri ∩ hane kaynakları).
    /// tenantId yoksa yalnızca ilk küme.
    /// </summary>
    public interface IPermissionService
    {
        Task<Result<bool>> HasPermissionAsync(int userId, int? tenantId, string permission);
        Task<Result<List<string>>> GetUserPermissionsAsync(int userId, int? tenantId);

        /// Kullanıcının bütün hanelerdeki izin önbelleğini tek seferde geçersiz kılar (üyelik ya da rol değiştiğinde)
        void ClearUserPermissionCache(int userId);
        void ClearRolePermissionCache();
    }
}
