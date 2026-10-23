using Abacasa.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Abacasa.Domain.Common.Interfaces.Repositories;

// Üyelik tenant filtresine girmez; sorgular kullanıcıya göre yapılır, yalnızca canlı (soft-delete edilmemiş) üyelikler döner
public interface ITenantMembershipRepository : IRepository<TenantMembership, int>
{
    // Kullanıcının canlı üyelikleri haneleriyle, en eski önce (hanesi silinmiş üyelikler hariç)
    Task<List<TenantMembership>> GetByUserReadOnlyAsync(int userId);

    // Kullanıcının o hanedeki canlı üyeliği (hane aktiflik kontrolü çağırana kalır)
    Task<TenantMembership?> GetActiveAsync(int userId, int tenantId);

    // Kullanıcının canlı yönetici üyelik sayısı
    Task<int> CountAdminMembershipsAsync(int userId);

    // Hanenin canlı üyelikleri kullanıcı ve kişiyle, en eski önce
    Task<List<TenantMembership>> GetByTenantReadOnlyAsync(int tenantId);

    // Hanedeki canlı üyelik (başka hanenin üyeliği dönmez)
    Task<TenantMembership?> GetInTenantAsync(int membershipId, int tenantId);

    Task<int> CountByTenantAsync(int tenantId);
    Task<int> CountAdminsByTenantAsync(int tenantId);

    // Kişi hanede canlı bir üyeliğe bağlı mı
    Task<bool> IsPersonLinkedAsync(int personId, int? excludeMembershipId = null);

    // Bu e-postadaki kullanıcı hanede canlı üye mi
    Task<bool> IsEmailMemberAsync(string email, int tenantId);
}
