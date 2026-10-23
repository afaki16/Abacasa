using Abacasa.Domain.Common.Interfaces;

namespace Abacasa.Domain.Entities;

public class Vehicle : BaseAuditableEntity, ITenantScoped
{
    public int TenantId { get; set; }
    public string Name { get; set; }

    // Trim ve büyük harfle saklanır; hanede benzersiz
    public string Plate { get; set; }

    // Boşsa araç hanenindir
    public int? OwnerPersonId { get; set; }
    public Person? OwnerPerson { get; set; }

    public bool IsActive { get; set; }
    public string? Note { get; set; }

    public Vehicle()
    {
        IsActive = true;
    }
}
