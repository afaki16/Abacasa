using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Ledger.Dtos;
using Abacasa.Domain.Common.Enums;
using MediatR;

namespace Abacasa.Application.Features.Ledger.Commands.UpdateLedgerItem;

public class UpdateLedgerItemCommand : IRequest<Result<LedgerItemListDto>>
{
    public int Id { get; set; }
    public string Name { get; set; }
    public LedgerDirection Direction { get; set; }
    public int? OwnerPersonId { get; set; }
    public bool IsActive { get; set; }
}
