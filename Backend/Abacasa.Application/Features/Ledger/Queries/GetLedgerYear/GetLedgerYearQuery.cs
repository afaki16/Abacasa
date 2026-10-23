using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Ledger.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Ledger.Queries.GetLedgerYear;

public class GetLedgerYearQuery : IRequest<Result<LedgerYearDto>>
{
    public int Year { get; set; }
}
