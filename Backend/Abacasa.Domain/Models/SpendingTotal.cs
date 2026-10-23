using Abacasa.Domain.Common.Enums;

namespace Abacasa.Domain.Models;

/// Harcama ya da bağış toplamı, ödeme aracı ve kişiye göre gruplu (Özet için).
/// Kişi harcamada OwnerPersonId, bağışta GiverPersonId; boşsa hane.
public class SpendingTotal
{
    public int PaymentMethodId { get; set; }
    public string PaymentMethodName { get; set; }
    public PaymentMethodType PaymentMethodType { get; set; }
    public int? PersonId { get; set; }
    public string? PersonName { get; set; }
    public decimal Total { get; set; }
}
