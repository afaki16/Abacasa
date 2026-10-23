using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using System;

namespace Abacasa.Domain.Entities;

public class Donation : BaseAuditableEntity, ITenantScoped
{
    public int TenantId { get; set; }
    public DateOnly Date { get; set; }
    public decimal Amount { get; set; }
    public DonationKind Kind { get; set; }
    public string Recipient { get; set; }

    // Boşsa bağışı hane vermiştir
    public int? GiverPersonId { get; set; }
    public Person? GiverPerson { get; set; }

    public int PaymentMethodId { get; set; }
    public PaymentMethod PaymentMethod { get; set; }

    public string? Note { get; set; }

    // Sabit ödemeden oluşturulduysa bağlı plan ve vade ayı (ayın 1'i)
    public int? RecurringPaymentId { get; set; }
    public RecurringPayment? RecurringPayment { get; set; }
    public DateOnly? RecurringPaymentMonth { get; set; }

    // Emanetten dağıtıldıysa bağlı emanet; böyle bağış hiçbir toplama ve hedefe girmez
    public int? FundId { get; set; }
    public DonationFund? Fund { get; set; }
}
