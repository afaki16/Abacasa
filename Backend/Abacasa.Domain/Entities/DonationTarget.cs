using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;

namespace Abacasa.Domain.Entities;

// Kişi (boşsa hane) × yıl × bağış türü için hedef tutar. Verilen ve planlanan saklanmaz; kayıtlardan hesaplanır.
public class DonationTarget : BaseAuditableEntity, ITenantScoped
{
    public int TenantId { get; set; }

    // Boşsa hane
    public int? OwnerPersonId { get; set; }
    public Person? OwnerPerson { get; set; }

    public int Year { get; set; }
    public DonationKind Kind { get; set; }
    public decimal Amount { get; set; }
    public string? Note { get; set; }
}
