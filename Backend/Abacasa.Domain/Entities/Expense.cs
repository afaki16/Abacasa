using Abacasa.Domain.Common.Interfaces;
using System;

namespace Abacasa.Domain.Entities;

public class Expense : BaseAuditableEntity, ITenantScoped
{
    public int TenantId { get; set; }
    public DateOnly Date { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }

    public int CategoryId { get; set; }
    public Category Category { get; set; }

    public int PaymentMethodId { get; set; }
    public PaymentMethod PaymentMethod { get; set; }

    // Boşsa harcama hanenindir
    public int? OwnerPersonId { get; set; }
    public Person? OwnerPerson { get; set; }

    // Sabit ödemeden oluşturulduysa bağlı plan ve vade ayı (ayın 1'i)
    public int? RecurringPaymentId { get; set; }
    public RecurringPayment? RecurringPayment { get; set; }
    public DateOnly? RecurringPaymentMonth { get; set; }
}
