using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;

namespace Abacasa.Domain.Entities;

public class PaymentMethod : BaseAuditableEntity, ITenantScoped
{
    public int TenantId { get; set; }
    public string Name { get; set; }
    public PaymentMethodType Type { get; set; }
    public string? Bank { get; set; }

    // Boşsa kayıt hanenindir
    public int? OwnerPersonId { get; set; }
    public Person? OwnerPerson { get; set; }

    public int? StatementDay { get; set; }
    public bool IsActive { get; set; }

    public PaymentMethod()
    {
        IsActive = true;
    }
}
