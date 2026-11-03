using Abacasa.Application.Common.Localization;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;

namespace Abacasa.Application.Features.Households.Common;

// Hane modülleri (aktif hanenin Tenant kaydında). Kapalı modülün uçları 403 döner; veriler silinmez.
public static class HouseholdModules
{
    // Bağış hedefleri ve emanetler (DonationTargets, DonationFunds, emanetten dağıtım)
    public static async Task<bool> IsDonationExtrasEnabledAsync(IUnitOfWork unitOfWork, ICurrentUserService currentUserService)
    {
        if (currentUserService.TenantId is not int tenantId)
            return false;
        var tenant = await unitOfWork.Tenants.GetByIdAsync(tenantId);
        return tenant?.DonationExtrasEnabled == true;
    }

    public static Error DisabledError(IJsonStringLocalizer localizer) =>
        Error.Failure(ErrorCode.Forbidden, localizer["households.moduleDisabled"], 403);
}
