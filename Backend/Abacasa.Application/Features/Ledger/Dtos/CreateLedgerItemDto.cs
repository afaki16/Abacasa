using Abacasa.Domain.Common.Enums;

namespace Abacasa.Application.Features.Ledger.Dtos;

public class CreateLedgerItemDto
{
    public string Name { get; set; }
    public LedgerDirection Direction { get; set; }
    public int? OwnerPersonId { get; set; }
}
