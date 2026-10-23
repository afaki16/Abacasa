using Abacasa.Application.Features.Debts.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Entities;
using System;
using System.Linq;

namespace Abacasa.Application.Features.Debts.Common;

// Borç tutarları canlı ödemelerden hesaplanır; hiçbiri saklanmaz.
// Debt.Payments filtreli yüklenir, silinmiş ödemeler toplama girmez.
public static class DebtAmounts
{
    public static decimal ToTry(decimal amount, decimal rate) =>
        Math.Round(amount * rate, 2, MidpointRounding.AwayFromZero);

    // TL ödemede tutarın kendisi, döviz ödemede tutar × kur
    public static decimal PaymentInTry(DebtPayment payment) =>
        payment.ExchangeRate.HasValue ? ToTry(payment.Amount, payment.ExchangeRate.Value) : payment.Amount;

    public static decimal Paid(Debt debt) => debt.Payments.Sum(p => p.Amount);

    public static decimal Remaining(Debt debt) => debt.Amount - Paid(debt);

    // usdRate güncel USD kurudur; yoksa USD borcun kalan TL karşılığı null olur
    public static void Fill(DebtListDto dto, Debt debt, decimal? usdRate)
    {
        dto.PaidAmount = Paid(debt);
        dto.Remaining = debt.Amount - dto.PaidAmount;
        dto.IsClosed = dto.Remaining == 0;
        dto.PaidInTry = debt.Payments.Sum(PaymentInTry);
        dto.RemainingInTry = debt.Currency == Currency.TRY
            ? dto.Remaining
            : usdRate.HasValue ? ToTry(dto.Remaining, usdRate.Value) : null;
        dto.PaymentCount = debt.Payments.Count;
        dto.HasPayments = dto.PaymentCount > 0;
    }
}
