using System;

namespace Abacasa.Application.Features.RecurringPayments.Dtos;

public class PayRecurringPaymentDto
{
    /// Ayın 1'i
    public DateOnly? Month { get; set; }
    /// Boşsa planın beklenen tutarı
    public decimal? Amount { get; set; }
    public DateOnly? Date { get; set; }
}

public class RecurringPaymentPayResultDto
{
    /// "expense" ya da "donation"
    public string Type { get; set; }
    public int Id { get; set; }
}
