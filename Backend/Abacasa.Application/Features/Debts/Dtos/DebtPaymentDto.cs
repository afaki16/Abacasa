using System;

namespace Abacasa.Application.Features.Debts.Dtos;

public class DebtPaymentDto
{
    public int Id { get; set; }
    public int DebtId { get; set; }
    public DateOnly Date { get; set; }
    public decimal Amount { get; set; }          // Borcun para biriminde
    public decimal? ExchangeRate { get; set; }
    public decimal AmountInTry { get; set; }     // TL'de tutarın kendisi, dövizde tutar × kur
    public string? Note { get; set; }
    public DateTime CreatedDate { get; set; }
}

// Ekleme ve güncelleme için ortak gövde
public class SaveDebtPaymentDto
{
    public DateOnly? Date { get; set; }
    public decimal Amount { get; set; }
    public decimal? ExchangeRate { get; set; }
    public string? Note { get; set; }
}
