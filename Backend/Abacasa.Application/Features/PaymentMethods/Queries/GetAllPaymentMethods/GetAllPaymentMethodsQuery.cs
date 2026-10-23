using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.PaymentMethods.Dtos;
using MediatR;

namespace Abacasa.Application.Features.PaymentMethods.Queries.GetAllPaymentMethods;

public class GetAllPaymentMethodsQuery : IRequest<PagedResult<PaymentMethodListDto>>
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string SearchTerm { get; set; }
    public bool? IsActive { get; set; }
}
