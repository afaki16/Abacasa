using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using System;

namespace Abacasa.Domain.Entities;

// Her ay tekrarlanan ödeme planı. Ödenme durumu saklanmaz; plana ve aya bağlı canlı harcama/bağış kaydından hesaplanır.
public class RecurringPayment : BaseAuditableEntity, ITenantScoped
{
    public int TenantId { get; set; }
    public string Name { get; set; }
    public RecurringPaymentKind Kind { get; set; }
    public decimal? ExpectedAmount { get; set; }
    public int DueDay { get; set; }

    // Her zaman ayın 1'i
    public DateOnly StartMonth { get; set; }

    public bool IsActive { get; set; }

    public int PaymentMethodId { get; set; }
    public PaymentMethod PaymentMethod { get; set; }

    public int? CategoryId { get; set; }
    public Category? Category { get; set; }

    // Bağış türünde veren kişi; boşsa hane
    public int? OwnerPersonId { get; set; }
    public Person? OwnerPerson { get; set; }

    // Bağış türü alanları
    public string? Recipient { get; set; }
    public DonationKind? DonationKind { get; set; }

    // Taksit türü alanları
    public decimal? TotalAmount { get; set; }
    public int? InstallmentCount { get; set; }
    public DateOnly? FirstDueDate { get; set; }

    public RecurringPayment()
    {
        IsActive = true;
    }
}
