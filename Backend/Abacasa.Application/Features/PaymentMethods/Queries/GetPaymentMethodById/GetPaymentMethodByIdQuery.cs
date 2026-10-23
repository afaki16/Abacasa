using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.PaymentMethods.Dtos;
using MediatR;

namespace Abacasa.Application.Features.PaymentMethods.Queries.GetPaymentMethodById;

public class GetPaymentMethodByIdQuery : IRequest<Result<PaymentMethodDto>>
{
    public int Id { get; set; }
}
