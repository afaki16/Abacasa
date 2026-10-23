using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using System;

namespace Abacasa.Domain.Entities;

// Araç işlemi: trafik sigortası, kasko, muayene ya da MTV. Güncel kayıt, araç ve tür için en büyük ValidUntil'e sahip kayıttır.
public class VehicleObligation : BaseAuditableEntity, ITenantScoped
{
    public int TenantId { get; set; }

    public int VehicleId { get; set; }
    public Vehicle Vehicle { get; set; }

    public VehicleObligationType Type { get; set; }
    public DateOnly Date { get; set; }
    public DateOnly ValidUntil { get; set; }
    public decimal? Amount { get; set; }
    public string? Note { get; set; }

    // "Harcama olarak da kaydet" ile oluşan harcama; işlemin tarih/tutar değişikliği ve silinmesi harcamaya yansır, tersi yansımaz
    public int? ExpenseId { get; set; }
    public Expense? Expense { get; set; }
}
