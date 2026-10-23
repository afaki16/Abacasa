using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.RecurringPayments.Dtos;
using MediatR;
using System;

namespace Abacasa.Application.Features.RecurringPayments.Queries.GetRecurringPaymentOccurrences;

public class GetRecurringPaymentOccurrencesQuery : IRequest<Result<RecurringPaymentOccurrencesDto>>
{
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
}
