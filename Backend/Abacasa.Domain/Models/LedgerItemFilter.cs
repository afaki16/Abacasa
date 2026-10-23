using Abacasa.Domain.Common.Enums;

namespace Abacasa.Domain.Models;

/// Gelir/gider kalemi listesi için filtre. SearchTerm Name içinde arar.
public class LedgerItemFilter
{
    public LedgerDirection? Direction { get; set; }
    public bool? IsActive { get; set; }
    public string? SearchTerm { get; set; }
}
