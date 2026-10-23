using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Entities;
using System;

namespace Abacasa.Application.Features.RecurringPayments.Common;

// Vade hesapları; vadeler ve ödeme aynı kuralları kullanır
public static class RecurringPaymentSchedule
{
    public static DateOnly MonthStart(DateOnly date) => new(date.Year, date.Month, 1);

    // Ay kısaysa vade ayın son günüdür
    public static DateOnly DueDate(RecurringPayment plan, DateOnly month) =>
        new(month.Year, month.Month, Math.Min(plan.DueDay, DateTime.DaysInMonth(month.Year, month.Month)));

    /// Plan bu ay (ayın 1'i) için vade üretir mi. Taksitte taksit numarasını da döner.
    public static bool IsDueInMonth(RecurringPayment plan, DateOnly month, out int? installmentNo)
    {
        installmentNo = null;

        if (month < plan.StartMonth)
            return false;

        if (plan.Kind == RecurringPaymentKind.Installment)
        {
            if (!plan.FirstDueDate.HasValue || !plan.InstallmentCount.HasValue)
                return false;

            var first = plan.FirstDueDate.Value;
            var no = (month.Year * 12 + month.Month) - (first.Year * 12 + first.Month) + 1;
            if (no < 1 || no > plan.InstallmentCount.Value)
                return false;

            installmentNo = no;
        }

        return true;
    }

    /// Taksitte DueDay ve StartMonth FirstDueDate'ten türetilir; beklenen tutar boşsa toplam / sayı.
    /// Diğer türlerde istekteki değerler kullanılır (validator zorunluluğu sağlar).
    public static (int DueDay, DateOnly StartMonth, decimal? ExpectedAmount) Derive(IRecurringPaymentFields request)
    {
        if (request.Kind == RecurringPaymentKind.Installment)
        {
            var first = request.FirstDueDate!.Value;
            var expected = request.ExpectedAmount
                ?? Math.Round(request.TotalAmount!.Value / request.InstallmentCount!.Value, 2, MidpointRounding.AwayFromZero);
            return (first.Day, MonthStart(first), expected);
        }

        return (request.DueDay!.Value, request.StartMonth!.Value, request.ExpectedAmount);
    }
}
