using Abacasa.Domain.Common.Interfaces;
using System;

namespace Abacasa.Domain.Entities;

public class DebtPayment : BaseAuditableEntity, ITenantScoped
{
    public int TenantId { get; set; }

    public int DebtId { get; set; }
    public Debt Debt { get; set; }

    public DateOnly Date { get; set; }

    // Borcun para biriminde
    public decimal Amount { get; set; }

    // Döviz borçta ödeme anındaki kur (elle girilir); TL borçta boş
    public decimal? ExchangeRate { get; set; }

    public string? Note { get; set; }
}
