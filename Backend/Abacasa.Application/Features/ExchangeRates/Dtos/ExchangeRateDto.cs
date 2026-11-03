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

// Bir birimin güncel kuru (CurrentRates): Source "TCMB" ya da "Elle"
public class CurrentRateDto
{
    public Currency Currency { get; set; }
    public decimal Rate { get; set; }
    public DateOnly Date { get; set; }
    public string Source { get; set; } = string.Empty;
}

// TCMB'den yazılan kur (elle tetiklemenin yanıtı)
public class MarketRateDto
{
    public Currency Currency { get; set; }
    public decimal Rate { get; set; }
    public DateOnly Date { get; set; }
    public string Source { get; set; } = string.Empty;
    public DateTime FetchedAt { get; set; }
    // Kayıt yeni eklendiyse true, aynı (birim, tarih) kaydı güncellendiyse false
    public bool Created { get; set; }
}

// Aynı (Currency, Date) kaydı güncellendiyse Created false olur (200), yeni açıldıysa true (201)
public class SaveExchangeRateResultDto
{
    public ExchangeRateDto Rate { get; set; }
    public bool Created { get; set; }
}
