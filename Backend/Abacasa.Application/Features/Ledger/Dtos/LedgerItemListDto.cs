using Abacasa.Domain.Common.Enums;
using System;

namespace Abacasa.Application.Features.Ledger.Dtos;

public class LedgerItemListDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public LedgerDirection Direction { get; set; }
    public int? OwnerPersonId { get; set; }
    public string? OwnerName { get; set; }       // Boşsa kalem hanenindir
    public bool IsActive { get; set; }
    /// Tutarı varsa yön değiştirilemez ve kalem silinemez (handler'da doldurulur)
    public bool HasAmounts { get; set; }
    public DateTime CreatedDate { get; set; }
}
