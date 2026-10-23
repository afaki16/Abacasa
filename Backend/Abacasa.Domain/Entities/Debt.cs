using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using System;
using System.Collections.Generic;

namespace Abacasa.Domain.Entities;

// Bir kez kaydedilen borç. Ödenen, kalan ve kapanma durumu saklanmaz; canlı ödemelerden hesaplanır.
public class Debt : BaseAuditableEntity, ITenantScoped
{
    public int TenantId { get; set; }

    // Alacaklı
    public int CreditorPersonId { get; set; }
    public Person CreditorPerson { get; set; }

    // Borçlu; boşsa hane
    public int? DebtorPersonId { get; set; }
    public Person? DebtorPerson { get; set; }

    public Currency Currency { get; set; }

    // Borcun kendi para biriminde
    public decimal Amount { get; set; }

    public DateOnly Date { get; set; }
    public string? Note { get; set; }

    public ICollection<DebtPayment> Payments { get; set; } = new List<DebtPayment>();
}
