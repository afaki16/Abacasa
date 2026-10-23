using Abacasa.Application.Common.Localization;
using Abacasa.Application.Features.DonationFunds.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;

namespace Abacasa.Application.Features.DonationFunds.Common;

// Emanet hesapları kayıtlardan yapılır; hiçbiri saklanmaz.
// dağıtılan = bağlı canlı bağışlar, kullanımda = kullanımlar − yerine koymalar,
// kalan = tutar − dağıtılan, elde = kalan − kullanımda. Her değişiklikten sonra kullanımda ≥ 0 ve elde ≥ 0.
public class FundBalance
{
    public decimal Amount { get; set; }
    public decimal Distributed { get; set; }
    public decimal Uses { get; set; }
    public decimal Returns { get; set; }

    public decimal InUse => Uses - Returns;
    public decimal Remaining => Amount - Distributed;
    public decimal OnHand => Remaining - InUse;

    public static FundBalance From(DonationFund fund, FundTotals totals) => new()
    {
        Amount = fund.Amount,
        Distributed = totals.Distributed,
        Uses = totals.Uses,
        Returns = totals.Returns
    };

    // Hareketi bakiyeye uygular (eklemede ya da güncellemede yeni hali)
    public void Apply(FundMovementType type, decimal amount)
    {
        if (type == FundMovementType.Use)
            Uses += amount;
        else
            Returns += amount;
    }

    /// Kural bozuluyorsa hata mesajının anahtarı, yoksa null
    public string? ViolationKey() =>
        InUse < 0 ? "donationFunds.returnExceedsInUse"
        : OnHand < 0 ? "donationFunds.onHandInsufficient"
        : null;

    public static void Fill(DonationFundDto dto, DonationFund fund, FundTotals totals)
    {
        var balance = From(fund, totals);
        dto.Distributed = balance.Distributed;
        dto.InUse = balance.InUse;
        dto.Remaining = balance.Remaining;
        dto.OnHand = balance.OnHand;
        dto.IsClosed = balance.Remaining == 0;
        dto.DistributionCount = totals.DistributionCount;
        dto.MovementCount = totals.MovementCount;
    }

    // Bağış listesinde emanet etiketi: "Kimden · Tür"
    public static string Label(DonationFund fund, IJsonStringLocalizer localizer) =>
        $"{fund.FromPerson?.Name} · {KindLabel(fund.Kind, localizer)}";

    public static string KindLabel(DonationKind kind, IJsonStringLocalizer localizer) => kind switch
    {
        DonationKind.Zakat => localizer["donationKinds.zakat"],
        DonationKind.Scholarship => localizer["donationKinds.scholarship"],
        _ => localizer["donationKinds.donation"]
    };
}
