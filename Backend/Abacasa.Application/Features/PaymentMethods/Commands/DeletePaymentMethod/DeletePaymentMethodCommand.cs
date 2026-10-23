using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.PaymentMethods.Commands.DeletePaymentMethod;

public class DeletePaymentMethodCommand : IRequest<Result<bool>>
{
    public int Id { get; set; }
}
