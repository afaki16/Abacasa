using Abacasa.Domain.Common.Enums;
using System;

namespace Abacasa.Application.Features.PaymentMethods.Dtos;

public class PaymentMethodListDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public PaymentMethodType Type { get; set; }
    public string? Bank { get; set; }
    public int? OwnerPersonId { get; set; }
    public string? OwnerPersonName { get; set; }     // Navigation'dan flatten; boşsa kayıt hanenindir
    public int? StatementDay { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedDate { get; set; }
}
