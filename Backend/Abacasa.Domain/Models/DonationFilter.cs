using Abacasa.Domain.Common.Enums;
using System;

namespace Abacasa.Domain.Models;

/// Bağış listesi ve özeti için ortak filtre. Tarihler dahil (StartDate ≤ Date ≤ EndDate).
public class DonationFilter
{
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public DonationKind? Kind { get; set; }
    public string? SearchTerm { get; set; }
    public int? FundId { get; set; }
}
