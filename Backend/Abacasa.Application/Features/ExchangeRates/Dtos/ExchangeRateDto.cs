using Abacasa.Domain.Common.Enums;
using System;

namespace Abacasa.Application.Features.ExchangeRates.Dtos;

public class ExchangeRateDto
{
    public int Id { get; set; }
    public Currency Currency { get; set; }
    public decimal Rate { get; set; }
    public DateOnly Date { get; set; }
    public DateTime CreatedDate { get; set; }
}

public class SaveExchangeRateDto
{
    public Currency Currency { get; set; }
    public decimal Rate { get; set; }
    public DateOnly? Date { get; set; }
}

// Aynı (Currency, Date) kaydı güncellendiyse Created false olur (200), yeni açıldıysa true (201)
public class SaveExchangeRateResultDto
{
    public ExchangeRateDto Rate { get; set; }
    public bool Created { get; set; }
}
