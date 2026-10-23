using Abacasa.Domain.Common.Interfaces;

namespace Abacasa.Domain.Entities;

// Elle kalemin bir ayı. Kayıt yoksa hücre "girilmemiş"tir; 0 girilmiş hücre ayrı bir kayıttır.
public class MonthlyAmount : BaseAuditableEntity, ITenantScoped
{
    public int TenantId { get; set; }

    public int LedgerItemId { get; set; }
    public LedgerItem LedgerItem { get; set; }

    public int Year { get; set; }

    // 1–12
    public int Month { get; set; }

    public decimal Amount { get; set; }
}
