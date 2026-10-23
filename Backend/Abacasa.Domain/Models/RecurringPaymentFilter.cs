using Abacasa.Domain.Common.Enums;

namespace Abacasa.Domain.Models;

/// Sabit ödeme planı listesi için filtre. SearchTerm, Name ve Recipient içinde arar.
public class RecurringPaymentFilter
{
    public RecurringPaymentKind? Kind { get; set; }
    public bool? IsActive { get; set; }
    public string? SearchTerm { get; set; }
}
