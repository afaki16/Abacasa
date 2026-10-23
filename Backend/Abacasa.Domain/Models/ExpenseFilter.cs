using System;

namespace Abacasa.Domain.Models;

/// Harcama listesi ve özeti için ortak filtre. Tarihler dahil (StartDate ≤ Date ≤ EndDate).
public class ExpenseFilter
{
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public int? CategoryId { get; set; }
    public int? PaymentMethodId { get; set; }
    public int? OwnerPersonId { get; set; }
    public string? SearchTerm { get; set; }
}
