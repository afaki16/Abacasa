using Abacasa.Domain.Common.Enums;
using System;

namespace Abacasa.Application.Features.Donations.Dtos;

public class DonationDto
{
    public int Id { get; set; }
    public DateOnly Date { get; set; }
    public decimal Amount { get; set; }
    public DonationKind Kind { get; set; }
    public string Recipient { get; set; }
    public int? GiverPersonId { get; set; }
    public string? GiverPersonName { get; set; }
    public int PaymentMethodId { get; set; }
    public string PaymentMethodName { get; set; }
    public PaymentMethodType PaymentMethodType { get; set; }
    public string? Note { get; set; }
    public int? FundId { get; set; }
    public string? FundLabel { get; set; }
    public DateTime CreatedDate { get; set; }
    public int? CreatedBy { get; set; }
    public DateTime? UpdatedDate { get; set; }
    public int? UpdatedBy { get; set; }
}
