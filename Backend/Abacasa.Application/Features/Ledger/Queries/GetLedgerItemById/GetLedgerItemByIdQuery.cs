using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Ledger.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Ledger.Queries.GetLedgerItemById;

public class GetLedgerItemByIdQuery : IRequest<Result<LedgerItemDto>>
{
    public int Id { get; set; }
}
