using System;

namespace Abacasa.Application.Features.Debts.Dtos;

// Liste alanlarına ek olarak denetim alanları
public class DebtDto : DebtListDto
{
    public int? CreatedBy { get; set; }
    public DateTime? UpdatedDate { get; set; }
    public int? UpdatedBy { get; set; }
}
