using Abacasa.Domain.Common.Enums;
using System;

namespace Abacasa.Application.Features.RecurringPayments.Dtos;

public class UpdateRecurringPaymentDto
{
    public string Name { get; set; }
    public RecurringPaymentKind Kind { get; set; }
    public decimal? ExpectedAmount { get; set; }
    public int? DueDay { get; set; }
    public DateOnly? StartMonth { get; set; }
    public int PaymentMethodId { get; set; }
    public int? CategoryId { get; set; }
    public int? OwnerPersonId { get; set; }
    public string? Recipient { get; set; }
    public DonationKind? DonationKind { get; set; }
    public decimal? TotalAmount { get; set; }
    public int? InstallmentCount { get; set; }
    public DateOnly? FirstDueDate { get; set; }
    public bool IsActive { get; set; }
}
