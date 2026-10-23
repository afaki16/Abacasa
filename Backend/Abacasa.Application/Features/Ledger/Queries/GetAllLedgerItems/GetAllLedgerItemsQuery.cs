using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Ledger.Dtos;
using Abacasa.Domain.Common.Enums;
using MediatR;

namespace Abacasa.Application.Features.Ledger.Queries.GetAllLedgerItems;

public class GetAllLedgerItemsQuery : IRequest<PagedResult<LedgerItemListDto>>
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string SearchTerm { get; set; }
    public LedgerDirection? Direction { get; set; }
    public bool? IsActive { get; set; }
}
