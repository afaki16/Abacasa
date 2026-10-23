using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using System;

namespace Abacasa.Domain.Entities;

// Elle girilen kur. Güncel kur en büyük Date'e sahip kayıttır (eşitlikte en büyük Id).
public class ExchangeRate : BaseAuditableEntity, ITenantScoped
{
    public int TenantId { get; set; }
    public Currency Currency { get; set; }
    public decimal Rate { get; set; }
    public DateOnly Date { get; set; }
}
