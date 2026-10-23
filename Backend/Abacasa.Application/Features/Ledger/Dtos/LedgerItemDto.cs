using System;

namespace Abacasa.Application.Features.Ledger.Dtos;

// Liste alanlarına ek olarak denetim alanları
public class LedgerItemDto : LedgerItemListDto
{
    public int? CreatedBy { get; set; }
    public DateTime? UpdatedDate { get; set; }
    public int? UpdatedBy { get; set; }
}
