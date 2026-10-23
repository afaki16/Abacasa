using Abacasa.Application.Features.Households.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Constants;

namespace Abacasa.Application.Features.Auth.Commands.DeleteAccount;

// Hesap silmenin önizlemesi ve ön koşulları (önizleme ucu ve silme aynı hesabı kullanır)
public class AccountDeletionPlan
{
    // Kullanıcının son yönetici olduğu ve başka canlı üyesi olan haneler: önce başka bir üye yönetici yapılmalı
    public List<HouseholdDto> BlockedHouseholds { get; set; } = new();
    // Kullanıcının tek canlı üyesi olduğu haneler: hesapla birlikte silinir
    public List<HouseholdDto> HouseholdsToDelete { get; set; } = new();
    public bool IsLastSuperAdmin { get; set; }

    public static async Task<AccountDeletionPlan> BuildAsync(IUnitOfWork unitOfWork, int userId)
    {
        var plan = new AccountDeletionPlan();

        foreach (var membership in await unitOfWork.TenantMemberships.GetByUserReadOnlyAsync(userId))
        {
            var household = new HouseholdDto { Id = membership.TenantId, Name = membership.Tenant.Name };
            var memberCount = await unitOfWork.TenantMemberships.CountByTenantAsync(membership.TenantId);

            if (memberCount <= 1)
                plan.HouseholdsToDelete.Add(household);
            else if (membership.Role == HouseholdRole.Admin
                     && await unitOfWork.TenantMemberships.CountAdminsByTenantAsync(membership.TenantId) <= 1)
                plan.BlockedHouseholds.Add(household);
        }

        var user = await unitOfWork.Users.GetUserWithRolesReadOnlyAsync(userId);
        var isSuperAdmin = user?.UserRoles?.Any(ur => ur.Role?.Name == RoleNames.SuperAdmin) == true;
        plan.IsLastSuperAdmin = isSuperAdmin && await unitOfWork.Users.CountActiveSuperAdminsAsync() <= 1;

        return plan;
    }
}
