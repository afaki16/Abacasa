using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.PaymentMethods.Dtos;
using Abacasa.Domain.Common.Enums;
using MediatR;

namespace Abacasa.Application.Features.PaymentMethods.Commands.UpdatePaymentMethod;

public class UpdatePaymentMethodCommand : IRequest<Result<PaymentMethodListDto>>
{
    public int Id { get; set; }
    public string Name { get; set; }
    public PaymentMethodType Type { get; set; }
    public string? Bank { get; set; }
    public int? OwnerPersonId { get; set; }
    public int? StatementDay { get; set; }
    public bool IsActive { get; set; }
}
