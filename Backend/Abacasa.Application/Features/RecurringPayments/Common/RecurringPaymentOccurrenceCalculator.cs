using Abacasa.Application.Features.RecurringPayments.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Abacasa.Application.Features.RecurringPayments.Common;

// Aralıktaki vadelerin hesap sonucu. Plans ve MethodTypes, vadeyi plana (kişi) ve araç türüne (yemek kartı) bağlamak için.
public class RecurringPaymentOccurrenceCalculation
{
    public List<RecurringPaymentOccurrenceDto> Items { get; init; } = new();
    public Dictionary<int, RecurringPayment> Plans { get; init; } = new();
    public Dictionary<int, PaymentMethodType> MethodTypes { get; init; } = new();
}

// Vade hesabı; sabit ödeme vadeleri ve Özet aynı kodu kullanır.
// Durum saklanmaz; plana ve aya bağlı canlı kayıttan hesaplanır.
// Sorgular toplu: planlar, aralıktaki kayıtlar ve planların son ödenen tutarları (N+1 yok).
public static class RecurringPaymentOccurrenceCalculator
{
    /// start ≤ vade ≤ end olan vadeler, vadeye ve ada göre sıralı. Tarihler dahil.
    public static async Task<RecurringPaymentOccurrenceCalculation> CalculateAsync(IUnitOfWork unitOfWork, DateOnly start, DateOnly end)
    {
        var fromMonth = RecurringPaymentSchedule.MonthStart(start);
        var toMonth = RecurringPaymentSchedule.MonthStart(end);

        var plans = await unitOfWork.RecurringPayments.GetAllWithRelationsReadOnlyAsync();
        var records = await unitOfWork.RecurringPayments.GetPaymentRecordsAsync(fromMonth, toMonth);
        var lastPaidAmounts = await unitOfWork.RecurringPayments.GetLastPaidAmountsAsync();

        var recordsByPlanMonth = records
            .GroupBy(r => (r.RecurringPaymentId, r.Month))
            .ToDictionary(g => g.Key, g => g.ToList());

        var items = new List<RecurringPaymentOccurrenceDto>();

        for (var month = fromMonth; month <= toMonth; month = month.AddMonths(1))
        {
            foreach (var plan in plans)
            {
                var dueDate = RecurringPaymentSchedule.DueDate(plan, month);
                if (dueDate < start || dueDate > end)
                    continue;

                if (!RecurringPaymentSchedule.IsDueInMonth(plan, month, out var installmentNo))
                    continue;

                // Türe göre: bağış planı bağış kaydıyla, diğerleri harcama kaydıyla ödenir
                var isDonation = plan.Kind == RecurringPaymentKind.Donation;
                var record = recordsByPlanMonth.TryGetValue((plan.Id, month), out var planRecords)
                    ? planRecords.FirstOrDefault(r => isDonation ? r.DonationId.HasValue : r.ExpenseId.HasValue)
                    : null;

                if (!plan.IsActive && record == null)
                    continue;

                decimal? amount;
                var isEstimated = false;
                if (record != null)
                    amount = record.Amount;
                else if (plan.ExpectedAmount.HasValue)
                    amount = plan.ExpectedAmount;
                else if (lastPaidAmounts.TryGetValue(plan.Id, out var lastPaid))
                {
                    amount = lastPaid;
                    isEstimated = true;
                }
                else
                    amount = null;

                items.Add(new RecurringPaymentOccurrenceDto
                {
                    RecurringPaymentId = plan.Id,
                    Name = plan.Name,
                    Kind = plan.Kind,
                    Month = month,
                    DueDate = dueDate,
                    InstallmentNo = installmentNo,
                    InstallmentCount = plan.InstallmentCount,
                    PaymentMethodId = record?.PaymentMethodId ?? plan.PaymentMethodId,
                    PaymentMethodName = record?.PaymentMethodName ?? plan.PaymentMethod.Name,
                    CategoryName = plan.Category?.Name,
                    PersonName = plan.OwnerPerson?.Name,
                    Recipient = plan.Recipient,
                    IsPaid = record != null,
                    PaidAmount = record?.Amount,
                    PaidDate = record?.Date,
                    ExpenseId = record?.ExpenseId,
                    DonationId = record?.DonationId,
                    Amount = amount,
                    IsEstimated = isEstimated
                });
            }
        }

        // Ödenmiş vadede kaydın gerçek aracı (sonradan taşınmış olabilir), bekleyende planın aracı
        var methodTypes = plans
            .Select(p => (p.PaymentMethodId, p.PaymentMethod.Type))
            .Concat(records.Select(r => (r.PaymentMethodId, Type: r.PaymentMethodType)))
            .GroupBy(x => x.PaymentMethodId)
            .ToDictionary(g => g.Key, g => g.First().Type);

        return new RecurringPaymentOccurrenceCalculation
        {
            Items = items.OrderBy(i => i.DueDate).ThenBy(i => i.Name).ToList(),
            Plans = plans.ToDictionary(p => p.Id),
            MethodTypes = methodTypes
        };
    }
}
