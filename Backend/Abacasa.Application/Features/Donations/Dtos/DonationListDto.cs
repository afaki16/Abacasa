using Abacasa.Domain.Common.Enums;
using System;

namespace Abacasa.Application.Features.Donations.Dtos;

public class DonationListDto
{
    public int Id { get; set; }
    public DateOnly Date { get; set; }
    public decimal Amount { get; set; }
    public DonationKind Kind { get; set; }
    public string Recipient { get; set; }
    public int? GiverPersonId { get; set; }
    public string? GiverPersonName { get; set; }     // Boşsa bağışı hane vermiştir
    public int PaymentMethodId { get; set; }
    public string PaymentMethodName { get; set; }
    public PaymentMethodType PaymentMethodType { get; set; }
    public string? Note { get; set; }
    public int? FundId { get; set; }
    public string? FundLabel { get; set; }      // "Kimden · Tür" (handler'da doldurulur)
    public DateTime CreatedDate { get; set; }
}
