using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.RecurringPayments.Dtos;
using MediatR;

namespace Abacasa.Application.Features.RecurringPayments.Queries.GetRecurringPaymentById;

public class GetRecurringPaymentByIdQuery : IRequest<Result<RecurringPaymentDto>>
{
    public int Id { get; set; }
}
