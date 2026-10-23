using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Ledger.Dtos;
using Abacasa.Domain.Common.Enums;
using MediatR;

namespace Abacasa.Application.Features.Ledger.Commands.CreateLedgerItem;

public class CreateLedgerItemCommand : IRequest<Result<LedgerItemListDto>>
{
    public string Name { get; set; }
    public LedgerDirection Direction { get; set; }
    public int? OwnerPersonId { get; set; }
}
