using System;

namespace Abacasa.Application.Features.Ledger.Common;

// Yıllık tablo kuralları; hücre ve rapor aynı yıl aralığını kullanır
public static class LedgerRules
{
    public const int MinYear = 2000;
    public const int MaxYear = 2100;

    public static decimal Round(decimal value) => Math.Round(value, 2, MidpointRounding.AwayFromZero);

    // Ortalama = toplam ÷ verisi olan ay sayısı; 0 girilmiş ay sayılır, girilmemiş (null) ay sayılmaz
    public static decimal? Average(decimal total, int monthsWithData) =>
        monthsWithData > 0 ? Round(total / monthsWithData) : null;
}
