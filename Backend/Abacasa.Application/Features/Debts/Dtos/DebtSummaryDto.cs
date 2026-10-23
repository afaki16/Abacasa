using System;
using System.Collections.Generic;

namespace Abacasa.Application.Features.Debts.Dtos;

public class DebtSummaryDto
{
    public decimal OpenTry { get; set; }
    public decimal OpenUsd { get; set; }
    /// Güncel USD kuru; kur girilmemişse null
    public DebtRateDto? UsdRate { get; set; }
    /// Kur yoksa null
    public decimal? OpenUsdInTry { get; set; }
    /// Kur yoksa null
    public decimal? OpenTotalInTry { get; set; }
    /// Bütün ödemelerin TL karşılığı
    public decimal PaidTotalInTry { get; set; }
    public int OpenCount { get; set; }
    /// Yalnızca açık borcu olan alacaklılar, TotalInTry'ye göre azalan
    public List<DebtCreditorTotalDto> ByCreditor { get; set; } = new();
}

public class DebtRateDto
{
    public decimal Rate { get; set; }
    public DateOnly Date { get; set; }
}

public class DebtCreditorTotalDto
{
    public int PersonId { get; set; }
    public string Name { get; set; }
    public decimal OpenTry { get; set; }
    public decimal OpenUsd { get; set; }
    public decimal? OpenUsdInTry { get; set; }
    public decimal? TotalInTry { get; set; }
}
