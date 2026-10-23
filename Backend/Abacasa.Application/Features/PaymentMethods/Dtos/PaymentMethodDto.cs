using Abacasa.Domain.Common.Enums;
using System;

namespace Abacasa.Application.Features.PaymentMethods.Dtos;

public class PaymentMethodDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public PaymentMethodType Type { get; set; }
    public string? Bank { get; set; }
    public int? OwnerPersonId { get; set; }
    public string? OwnerPersonName { get; set; }
    public int? StatementDay { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedDate { get; set; }
    public int? CreatedBy { get; set; }
    public DateTime? UpdatedDate { get; set; }
    public int? UpdatedBy { get; set; }
}
