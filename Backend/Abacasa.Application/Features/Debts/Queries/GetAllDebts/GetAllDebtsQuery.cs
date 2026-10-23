using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Debts.Dtos;
using Abacasa.Domain.Common.Enums;
using MediatR;

namespace Abacasa.Application.Features.Debts.Queries.GetAllDebts;

public class GetAllDebtsQuery : IRequest<PagedResult<DebtListDto>>
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string SearchTerm { get; set; }
    public bool? IsClosed { get; set; }
    public int? CreditorPersonId { get; set; }
    public Currency? Currency { get; set; }
}
