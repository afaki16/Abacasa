using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Ledger.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Ledger.Commands.SetMonthlyAmount;

public class SetMonthlyAmountCommand : IRequest<Result<SetMonthlyAmountResultDto>>
{
    public int LedgerItemId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    /// null: hücreyi temizle
    public decimal? Amount { get; set; }
}
