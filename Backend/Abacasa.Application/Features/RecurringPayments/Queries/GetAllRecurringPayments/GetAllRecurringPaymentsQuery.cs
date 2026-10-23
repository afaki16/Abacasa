using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.RecurringPayments.Dtos;
using Abacasa.Domain.Common.Enums;
using MediatR;

namespace Abacasa.Application.Features.RecurringPayments.Queries.GetAllRecurringPayments;

public class GetAllRecurringPaymentsQuery : IRequest<PagedResult<RecurringPaymentListDto>>
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string SearchTerm { get; set; }
    public RecurringPaymentKind? Kind { get; set; }
    public bool? IsActive { get; set; }
}
