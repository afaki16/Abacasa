using Abacasa.Application.Features.ExchangeRates.Dtos;
using Abacasa.Domain.Common.Enums;
using System;
using System.Collections.Generic;

namespace Abacasa.Application.Features.Debts.Dtos;

public class DebtSummaryDto
{
    public decimal OpenTry { get; set; }
    /// Yalnızca açığı > 0 olan yabancı birimler (USD, EUR, çeyrek altın)
    public List<DebtForeignOpenDto> Foreign { get; set; } = new();
    /// Açığı olan bir birimin kuru yoksa null
    public decimal? OpenTotalInTry { get; set; }
    /// Bütün ödemelerin TL karşılığı
    public decimal PaidTotalInTry { get; set; }
    public int OpenCount { get; set; }
    /// USD, EUR ve çeyrek altının güncel kurları; kuru olmayan listeye girmez
    public List<CurrentRateDto> Rates { get; set; } = new();
    /// Yalnızca açık borcu olan alacaklılar, TotalInTry'ye göre azalan
    public List<DebtCreditorTotalDto> ByCreditor { get; set; } = new();
}

public class DebtRateDto
{
    public decimal Rate { get; set; }
    public DateOnly Date { get; set; }
    /// "TCMB" ya da "Elle"
    public string Source { get; set; } = string.Empty;
}

public class DebtForeignOpenDto
{
    public Currency Currency { get; set; }
    public decimal Open { get; set; }
    /// Birimin güncel kuru; yoksa null
    public DebtRateDto? Rate { get; set; }
    /// Kur yoksa null
    public decimal? OpenInTry { get; set; }
}

public class DebtCreditorForeignDto
{
    public Currency Currency { get; set; }
    public decimal Open { get; set; }
    public decimal? OpenInTry { get; set; }
}

public class DebtCreditorTotalDto
{
    public int PersonId { get; set; }
    public string Name { get; set; }
    public decimal OpenTry { get; set; }
    public List<DebtCreditorForeignDto> Foreign { get; set; } = new();
    /// Bir birimin kuru yoksa null
    public decimal? TotalInTry { get; set; }
}
