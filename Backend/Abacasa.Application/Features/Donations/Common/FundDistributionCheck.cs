using Abacasa.Application.Common.Localization;
using Abacasa.Application.Features.DonationFunds.Common;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using System.Threading.Tasks;

namespace Abacasa.Application.Features.Donations.Common;

// Emanetten dağıtılan bağışın kuralları; ekleme ve güncelleme aynı kodu kullanır
public static class FundDistributionCheck
{
    /// Emanet filtreli yüklenir; tür aynı olmalı ve kayıttan sonra elde ≥ 0 kalmalı.
    /// Güncellemede bağışın eski tutarı toplamdan hariç tutulur (excludeDonationId). Hata yoksa Error null.
    public static async Task<(DonationFund? Fund, string? Error)> CheckAsync(IUnitOfWork unitOfWork, IJsonStringLocalizer localizer,
        int fundId, DonationKind kind, decimal amount, int? excludeDonationId = null)
    {
        var fund = await unitOfWork.DonationFunds.GetWithPersonAsync(fundId);
        if (fund == null)
            return (null, localizer["donations.fundNotFound"]);

        if (fund.Kind != kind)
            return (fund, localizer["donations.fundKindMismatch"]);

        var totals = (await unitOfWork.DonationFunds.GetTotalsAsync(new[] { fund.Id }, excludeDonationId: excludeDonationId))[fund.Id];
        var balance = FundBalance.From(fund, totals);
        balance.Distributed += amount;
        if (balance.OnHand < 0)
            return (fund, localizer["donations.fundOnHandInsufficient"]);

        return (fund, null);
    }

    /// Bağış emanetten ayrılınca eski emanetin durumu (elde ≥ 0) ayrıca kontrol edilir
    public static async Task<string?> CheckReleasedAsync(IUnitOfWork unitOfWork, IJsonStringLocalizer localizer, int fundId, int donationId)
    {
        var fund = await unitOfWork.DonationFunds.GetByIdAsync(fundId);
        if (fund == null)
            return null;

        var totals = (await unitOfWork.DonationFunds.GetTotalsAsync(new[] { fund.Id }, excludeDonationId: donationId))[fund.Id];
        return FundBalance.From(fund, totals).OnHand < 0 ? localizer["donations.fundOnHandInsufficient"] : null;
    }
}
