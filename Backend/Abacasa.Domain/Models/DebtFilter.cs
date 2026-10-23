using Abacasa.Domain.Common.Enums;

namespace Abacasa.Domain.Models;

/// Borç listesi için filtre. IsClosed kalan tutara göre (ödemelerden) hesaplanır; SearchTerm Note içinde arar.
public class DebtFilter
{
    public bool? IsClosed { get; set; }
    public int? CreditorPersonId { get; set; }
    public Currency? Currency { get; set; }
    public string? SearchTerm { get; set; }
}
