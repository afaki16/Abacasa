using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Ledger.Common;
using Abacasa.Application.Features.Ledger.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using MediatR;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

namespace Abacasa.Application.Features.Ledger.Queries.GetLedgerYear;

// Yıllık tablo. Gelirler elle; gider tarafı otomatik satırlar (plan ödemeleri vade ayına,
// plan dışı harcama ve bağışlar kayıt ayına göre) + elle gider kalemleri. Yemek kartı hariç.
// Sorgular veritabanında gruplu ve sabit sayıda (N+1 yok).
public class GetLedgerYearQueryHandler : IRequestHandler<GetLedgerYearQuery, Result<LedgerYearDto>>
{
    // Adlar Türkçe sıralanır (Ç, Ö, Ş, Ü ...)
    private static readonly StringComparer NameComparer = StringComparer.Create(new CultureInfo("tr-TR"), ignoreCase: true);

    private readonly IUnitOfWork _unitOfWork;

    public GetLedgerYearQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<LedgerYearDto>> Handle(GetLedgerYearQuery request, CancellationToken cancellationToken)
    {
        var year = request.Year;

        var items = await _unitOfWork.LedgerItems.GetAllWithOwnerReadOnlyAsync();
        var amounts = await _unitOfWork.MonthlyAmounts.GetByYearReadOnlyAsync(year);
        var planExpenseTotals = await _unitOfWork.Expenses.GetPlanMonthTotalsAsync(year);
        var planDonationTotals = await _unitOfWork.Donations.GetPlanMonthTotalsAsync(year);
        var categoryTotals = await _unitOfWork.Expenses.GetUnplannedCategoryMonthTotalsAsync(year);
        var donationTotals = await _unitOfWork.Donations.GetUnplannedMonthTotalsAsync(year);

        var amountsByItem = amounts
            .GroupBy(a => a.LedgerItemId)
            .ToDictionary(g => g.Key, g => g.Select(a => (a.Month, a.Amount)));

        // a) Plan satırları: o yıl yemek kartı dışı bağlı kaydı olan planlar
        var planTotals = planExpenseTotals.Concat(planDonationTotals)
            .GroupBy(t => t.RecurringPaymentId)
            .ToDictionary(g => g.Key, g => g.Select(t => (t.Month, t.Total)));
        var plans = planTotals.Count > 0
            ? (await _unitOfWork.RecurringPayments.GetAllWithRelationsReadOnlyAsync())
                .Where(p => planTotals.ContainsKey(p.Id))
                .ToList()
            : new List<RecurringPayment>();

        var planRows = plans
            .OrderBy(p => p.Kind)
            .ThenBy(p => p.Name, NameComparer)
            .Select(p => BuildRow($"{LedgerRowSource.Plan}-{p.Id}", LedgerRowSource.Plan, p.Id, p.Name, p.Kind,
                p.OwnerPerson?.Name, planTotals[p.Id]));

        // b) Kategori satırları: plana bağlı olmayan harcamalar
        var categoryRows = categoryTotals
            .GroupBy(t => new { t.CategoryId, t.CategoryName })
            .OrderBy(g => g.Key.CategoryName, NameComparer)
            .Select(g => BuildRow($"{LedgerRowSource.Category}-{g.Key.CategoryId}", LedgerRowSource.Category,
                g.Key.CategoryId, g.Key.CategoryName, null, null, g.Select(t => (t.Month, t.Total))));

        // c) Plan dışı bağışlar: verisi yoksa satır yok
        var donationRows = donationTotals.Count > 0
            ? new[] { BuildRow(LedgerRowSource.Donations, LedgerRowSource.Donations, null, "Bağışlar (plan dışı)", null, null, donationTotals) }
            : Array.Empty<LedgerRowDto>();

        var incomeRows = ManualRows(items, LedgerDirection.Income, amountsByItem);
        var expenseRows = planRows
            .Concat(categoryRows)
            .Concat(donationRows)
            .Concat(ManualRows(items, LedgerDirection.Expense, amountsByItem))
            .ToList();

        return Result<LedgerYearDto>.Success(new LedgerYearDto
        {
            Year = year,
            IncomeRows = incomeRows,
            ExpenseRows = expenseRows,
            Totals = BuildTotals(incomeRows, expenseRows)
        });
    }

    // Aktif kalemler verisi olmasa da, pasif kalemler yalnızca o yıl verisi varsa listelenir
    private static List<LedgerRowDto> ManualRows(List<LedgerItem> items, LedgerDirection direction,
        Dictionary<int, IEnumerable<(int Month, decimal Amount)>> amountsByItem)
    {
        return items
            .Where(i => i.Direction == direction && (i.IsActive || amountsByItem.ContainsKey(i.Id)))
            .OrderBy(i => i.Name, NameComparer)
            .Select(i => BuildRow($"{LedgerRowSource.Manual}-{i.Id}", LedgerRowSource.Manual, i.Id, i.Name, null,
                i.OwnerPerson?.Name,
                amountsByItem.TryGetValue(i.Id, out var cells) ? cells : Enumerable.Empty<(int, decimal)>()))
            .ToList();
    }

    private static LedgerRowDto BuildRow(string key, string source, int? id, string name, RecurringPaymentKind? kind,
        string? ownerName, IEnumerable<(int Month, decimal Amount)> cells)
    {
        var months = new decimal?[12];
        foreach (var (month, amount) in cells)
            months[month - 1] = (months[month - 1] ?? 0m) + amount;

        var total = LedgerRules.Round(months.Sum(m => m ?? 0m));
        var monthsWithData = months.Count(m => m.HasValue);

        return new LedgerRowDto
        {
            Key = key,
            Source = source,
            Id = id,
            Name = name,
            Kind = kind,
            OwnerName = ownerName,
            Months = months.Select(m => m.HasValue ? LedgerRules.Round(m.Value) : (decimal?)null).ToArray(),
            Total = total,
            MonthsWithData = monthsWithData,
            Average = LedgerRules.Average(total, monthsWithData)
        };
    }

    // null'lar 0 sayılır; bölüm ortalaması satır ortalamalarının toplamıdır
    private static LedgerTotalsDto BuildTotals(List<LedgerRowDto> incomeRows, List<LedgerRowDto> expenseRows)
    {
        decimal[] ByMonth(List<LedgerRowDto> rows) =>
            Enumerable.Range(0, 12).Select(m => LedgerRules.Round(rows.Sum(r => r.Months[m] ?? 0m))).ToArray();

        var incomeByMonth = ByMonth(incomeRows);
        var expenseByMonth = ByMonth(expenseRows);
        var incomeTotal = LedgerRules.Round(incomeRows.Sum(r => r.Total));
        var expenseTotal = LedgerRules.Round(expenseRows.Sum(r => r.Total));
        var incomeAverage = LedgerRules.Round(incomeRows.Sum(r => r.Average ?? 0m));
        var expenseAverage = LedgerRules.Round(expenseRows.Sum(r => r.Average ?? 0m));

        return new LedgerTotalsDto
        {
            IncomeByMonth = incomeByMonth,
            ExpenseByMonth = expenseByMonth,
            NetByMonth = Enumerable.Range(0, 12).Select(m => incomeByMonth[m] - expenseByMonth[m]).ToArray(),
            IncomeTotal = incomeTotal,
            ExpenseTotal = expenseTotal,
            NetTotal = incomeTotal - expenseTotal,
            IncomeAverage = incomeAverage,
            ExpenseAverage = expenseAverage,
            NetAverage = incomeAverage - expenseAverage
        };
    }
}
