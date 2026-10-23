using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using System;

namespace Abacasa.Domain.Entities;

// Emanetten geçici kullanım ya da yerine koyma. Borç değildir; emanetin kalanını değiştirmez.
public class FundMovement : BaseAuditableEntity, ITenantScoped
{
    public int TenantId { get; set; }

    public int FundId { get; set; }
    public DonationFund Fund { get; set; }

    public FundMovementType Type { get; set; }
    public DateOnly Date { get; set; }
    public decimal Amount { get; set; }
    public string? Note { get; set; }
}
