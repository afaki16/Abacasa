using Abacasa.Application.Common.Localization;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Entities;
using System;
using System.Linq;

namespace Abacasa.Application.Features.Debts.Common;

// Ödeme ekleme ve güncellemede borca bağlı kurallar. Borç yüklendikten sonra çalışır (önce 404).
public static class DebtPaymentRules
{
    // Hata yoksa null döner. Güncellemede ödemenin kendisi toplamdan hariç tutulur (excludePaymentId).
    public static string? Check(Debt debt, DateOnly date, decimal amount, decimal? exchangeRate,
        int? excludePaymentId, IJsonStringLocalizer localizer)
    {
        // Kur borcun para birimine göre: dövizde zorunlu, TL'de boş
        if (debt.Currency == Currency.USD && !exchangeRate.HasValue)
            return localizer["debts.rateRequired"];

        if (debt.Currency == Currency.TRY && exchangeRate.HasValue)
            return localizer["debts.rateNotAllowed"];

        if (date < debt.Date)
            return localizer["debts.paymentBeforeDebt"];

        var otherPaid = debt.Payments
            .Where(p => p.Id != excludePaymentId)
            .Sum(p => p.Amount);

        if (otherPaid + amount > debt.Amount)
            return localizer["debts.paymentExceedsDebt", debt.Amount - otherPaid];

        return null;
    }
}
