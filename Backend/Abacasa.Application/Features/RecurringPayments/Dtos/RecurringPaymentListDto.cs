using Abacasa.Domain.Common.Enums;
using System;

namespace Abacasa.Application.Features.RecurringPayments.Dtos;

public class RecurringPaymentListDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public RecurringPaymentKind Kind { get; set; }
    public decimal? ExpectedAmount { get; set; }
    public int DueDay { get; set; }
    public DateOnly StartMonth { get; set; }
    public bool IsActive { get; set; }
    public int PaymentMethodId { get; set; }
    public string PaymentMethodName { get; set; }
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public int? OwnerPersonId { get; set; }
    public string? OwnerPersonName { get; set; }
    public string? Recipient { get; set; }
    public DonationKind? DonationKind { get; set; }
    public decimal? TotalAmount { get; set; }
    public int? InstallmentCount { get; set; }
    public DateOnly? FirstDueDate { get; set; }
    // Bağlı canlı harcama/bağış varsa tür, taksit sayısı ve ilk taksit tarihi değiştirilemez
    public bool HasPayments { get; set; }
    public DateTime CreatedDate { get; set; }
}
