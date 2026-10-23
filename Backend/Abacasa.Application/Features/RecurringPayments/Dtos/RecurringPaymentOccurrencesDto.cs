using Abacasa.Domain.Common.Enums;
using System;
using System.Collections.Generic;

namespace Abacasa.Application.Features.RecurringPayments.Dtos;

public class RecurringPaymentOccurrencesDto
{
    public List<RecurringPaymentOccurrenceDto> Items { get; set; } = new();
    public decimal PaidTotal { get; set; }
    /// Tahmini tutarlar dahil, tutarı belli olmayanlar hariç
    public decimal PendingTotal { get; set; }
    public decimal Total { get; set; }
    /// Tutarı belli olmayan bekleyen vade sayısı
    public int UnknownCount { get; set; }
    public List<RecurringPaymentMethodTotalDto> ByPaymentMethod { get; set; } = new();
}

public class RecurringPaymentOccurrenceDto
{
    public int RecurringPaymentId { get; set; }
    public string Name { get; set; }
    public RecurringPaymentKind Kind { get; set; }
    /// Ayın 1'i
    public DateOnly Month { get; set; }
    public DateOnly DueDate { get; set; }
    public int? InstallmentNo { get; set; }
    public int? InstallmentCount { get; set; }
    /// Ödenmişse kaydın gerçek aracı, bekliyorsa planın aracı
    public int PaymentMethodId { get; set; }
    public string PaymentMethodName { get; set; }
    public string? CategoryName { get; set; }
    public string? PersonName { get; set; }
    public string? Recipient { get; set; }
    public bool IsPaid { get; set; }
    public decimal? PaidAmount { get; set; }
    public DateOnly? PaidDate { get; set; }
    public int? ExpenseId { get; set; }
    public int? DonationId { get; set; }
    public decimal? Amount { get; set; }
    public bool IsEstimated { get; set; }
}

public class RecurringPaymentMethodTotalDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public PaymentMethodType Type { get; set; }
    public decimal PaidTotal { get; set; }
    public decimal PendingTotal { get; set; }
    public decimal Total { get; set; }
}
