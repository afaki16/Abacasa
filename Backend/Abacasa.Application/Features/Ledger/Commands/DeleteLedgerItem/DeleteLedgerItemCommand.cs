using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.Ledger.Commands.DeleteLedgerItem;

public class DeleteLedgerItemCommand : IRequest<Result<bool>>
{
    public int Id { get; set; }
}
