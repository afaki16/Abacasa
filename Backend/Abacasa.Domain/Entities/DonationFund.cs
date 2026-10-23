using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using System;
using System.Collections.Generic;

namespace Abacasa.Domain.Entities;

// Emanet: başkasının dağıtılsın diye verdiği para. Dağıtılan, kullanımda, kalan ve elde saklanmaz;
// bağlı bağışlardan (Distributions) ve hareketlerden (Movements) hesaplanır.
public class DonationFund : BaseAuditableEntity, ITenantScoped
{
    public int TenantId { get; set; }

    // Emaneti veren
    public int FromPersonId { get; set; }
    public Person FromPerson { get; set; }

    public DonationKind Kind { get; set; }
    public decimal Amount { get; set; }
    public DateOnly Date { get; set; }
    public string? Note { get; set; }

    public ICollection<Donation> Distributions { get; set; } = new List<Donation>();
    public ICollection<FundMovement> Movements { get; set; } = new List<FundMovement>();
}
