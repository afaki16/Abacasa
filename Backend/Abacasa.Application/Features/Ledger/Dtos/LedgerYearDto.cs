using Abacasa.Domain.Common.Enums;
using System.Collections.Generic;

namespace Abacasa.Application.Features.Ledger.Dtos;

// Takvim yılının aylara bölünmüş tablosu. Gelirler elle; gider tarafı otomatik satırlar + elle kalemler, yemek kartı hariç.
public class LedgerYearDto
{
    public int Year { get; set; }
    public List<LedgerRowDto> IncomeRows { get; set; } = new();
    /// Sırayla: plan, kategori, plan dışı bağış, elle gider kalemleri
    public List<LedgerRowDto> ExpenseRows { get; set; } = new();
    public LedgerTotalsDto Totals { get; set; } = new();
}

public static class LedgerRowSource
{
    public const string Manual = "manual";
    public const string Plan = "plan";
    public const string Category = "category";
    public const string Donations = "donations";
}

public class LedgerRowDto
{
    /// Satırın tablodaki benzersiz anahtarı, ör. "manual-5", "plan-12", "category-3", "donations"
    public string Key { get; set; }
    /// manual | plan | category | donations
    public string Source { get; set; }
    /// manual: kalem, plan: plan, category: kategori; donations satırında null
    public int? Id { get; set; }
    public string Name { get; set; }
    /// Yalnızca plan satırında planın türü
    public RecurringPaymentKind? Kind { get; set; }
    public string? OwnerName { get; set; }
    /// 12 ay; null "girilmemiş", 0 "0 girilmiş"
    public decimal?[] Months { get; set; } = new decimal?[12];
    public decimal Total { get; set; }
    public int MonthsWithData { get; set; }
    /// Verisi yoksa null
    public decimal? Average { get; set; }
}

public class LedgerTotalsDto
{
    /// 12'şer eleman; null'lar 0 sayılır
    public decimal[] IncomeByMonth { get; set; } = new decimal[12];
    public decimal[] ExpenseByMonth { get; set; } = new decimal[12];
    public decimal[] NetByMonth { get; set; } = new decimal[12];
    public decimal IncomeTotal { get; set; }
    public decimal ExpenseTotal { get; set; }
    public decimal NetTotal { get; set; }
    /// Satır ortalamalarının toplamı
    public decimal IncomeAverage { get; set; }
    public decimal ExpenseAverage { get; set; }
    /// IncomeAverage − ExpenseAverage
    public decimal NetAverage { get; set; }
}
