using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.RecurringPayments.Commands.DeleteRecurringPayment;

public class DeleteRecurringPaymentCommand : IRequest<Result<bool>>
{
    public int Id { get; set; }
}
