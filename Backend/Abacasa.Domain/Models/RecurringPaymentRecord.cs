using Abacasa.Domain.Common.Enums;
using System;

namespace Abacasa.Domain.Models;

/// Bir plana ve aya bağlı canlı harcama ya da bağış kaydı (ödenmiş vade).
/// PaymentMethod kaydın gerçek aracıdır; harcama sonradan başka karta taşınmış olabilir.
public class RecurringPaymentRecord
{
    public int RecurringPaymentId { get; set; }
    public DateOnly Month { get; set; }
    public DateOnly Date { get; set; }
    public decimal Amount { get; set; }
    public int PaymentMethodId { get; set; }
    public string PaymentMethodName { get; set; }
    public PaymentMethodType PaymentMethodType { get; set; }
    public int? ExpenseId { get; set; }
    public int? DonationId { get; set; }
}
