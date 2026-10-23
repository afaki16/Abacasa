using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;

namespace Abacasa.Domain.Entities;

// Yıllık tabloda elle açılan gelir ya da gider kalemi; aylık tutarları MonthlyAmount'ta
public class LedgerItem : BaseAuditableEntity, ITenantScoped
{
    public int TenantId { get; set; }
    public string Name { get; set; }
    public LedgerDirection Direction { get; set; }

    // Boşsa kalem hanenindir
    public int? OwnerPersonId { get; set; }
    public Person? OwnerPerson { get; set; }

    public bool IsActive { get; set; }

    public LedgerItem()
    {
        IsActive = true;
    }
}
