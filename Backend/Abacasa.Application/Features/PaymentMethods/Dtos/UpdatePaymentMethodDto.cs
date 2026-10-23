using Abacasa.Domain.Common.Enums;

namespace Abacasa.Application.Features.PaymentMethods.Dtos;

public class UpdatePaymentMethodDto
{
    public string Name { get; set; }
    public PaymentMethodType Type { get; set; }
    public string? Bank { get; set; }
    public int? OwnerPersonId { get; set; }
    public int? StatementDay { get; set; }
    public bool IsActive { get; set; }
}
