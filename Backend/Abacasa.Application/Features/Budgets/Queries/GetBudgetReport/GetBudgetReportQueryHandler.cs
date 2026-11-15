using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Budgets.Dtos;
using Abacasa.Application.Features.RecurringPayments.Common;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using MediatR;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

namespace Abacasa.Application.Features.Budgets.Queries.GetBudgetReport;

// Ayın bütçe raporu. Geçerli bütçe: her sahip (kişi ya da hane) için başlangıcı bu aya kadar olan en yeni kayıt; tutarı 0 ise bütçe yok.
// Kullanılan: ayın harcamaları (kayıt tarihine göre) + ayda vadesi olan ödenmemiş sabit ödemeler; yemek kartı, bağışlar ve
// bağış planları hariç. Kişi: harcamada sahip, bekleyen vadede planın kişisi. Vade hesabı Özet ile ortaktır.
public class GetBudgetReportQueryHandler : IRequestHandler<GetBudgetReportQuery, Result<BudgetReportDto>>
{
    // Adlar Türkçe sıralanır
    private static readonly StringComparer NameComparer = StringComparer.Create(new CultureInfo("tr-TR"), ignoreCase: true);

    private readonly IUnitOfWork _unitOfWork;

    public GetBudgetReportQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<BudgetReportDto>> Handle(GetBudgetReportQuery request, CancellationToken cancellationToken)
    {
        var year = request.Year;
        var month = request.Month;
        var today = request.Today!.Value;
        var start = new DateOnly(year, month, 1);
        var end = start.AddMonths(1).AddDays(-1);
        var daysInMonth = end.Day;
        var daysLeft = today < start ? daysInMonth : today > end ? 0 : end.Day - today.Day + 1;

        // Geçerli bütçeler: (sahip, kategori) başına en yeni başlangıç; genel ve kategori bütçeleri ayrılır
        var started = await _unitOfWork.Budgets.GetStartedByReadOnlyAsync(year, month);
        var effectiveAll = started
            .GroupBy(b => new { b.OwnerPersonId, b.CategoryId })
            .Select(g => g.OrderByDescending(b => b.StartYear).ThenByDescending(b => b.StartMonth).First())
            .Where(b => b.Amount > 0)
            .ToList();
        var effective = effectiveAll.Where(b => b.CategoryId == null).ToList();
        var categoryBudgets = effectiveAll
            .Where(b => b.CategoryId != null)
            .OrderBy(b => b.Category?.Name, NameComparer)
            .ToList();
        var household = effective.FirstOrDefault(b => b.OwnerPersonId == null);
        var personBudgets = effective
            .Where(b => b.OwnerPersonId != null)
            .OrderBy(b => b.OwnerPerson?.Name, NameComparer)
            .ToList();

        // Gerçekleşen harcamalar (yemek kartı hariç), kişiye göre
        var expenseTotals = await _unitOfWork.Expenses.GetTotalsByPaymentMethodAndPersonAsync(
            new ExpenseFilter { StartDate = start, EndDate = end });
        var spentByPerson = expenseTotals
            .Where(r => r.PaymentMethodType != PaymentMethodType.MealCard)
            .GroupBy(r => r.PersonId)
            .ToDictionary(g => g.Key ?? 0, g => g.Sum(r => r.Total));

        // Ayın vadeleri; ödenmiş vade zaten harcama kaydıdır, bekleyene yalnızca ödenmemişler girer
        var period = await RecurringPaymentOccurrenceCalculator.CalculateAsync(_unitOfWork, start, end);
        var budgetItems = period.Items
            .Where(i => period.MethodTypes[i.PaymentMethodId] != PaymentMethodType.MealCard
                && period.Plans[i.RecurringPaymentId].Kind != RecurringPaymentKind.Donation)
            .ToList();
        var pendingItems = budgetItems.Where(i => !i.IsPaid).ToList();
        var pendingByPerson = pendingItems
            .GroupBy(i => period.Plans[i.RecurringPaymentId].OwnerPersonId)
            .ToDictionary(g => g.Key ?? 0, g => g.Sum(i => i.Amount ?? 0m));

        // Kullanılan, kalan, günlük ve yüzde Spent ve Pending'den hesaplanır
        void FillTotals(BudgetRowDto row)
        {
            row.Used = row.Spent + row.Pending;
            row.Remaining = row.Budget - row.Used;
            row.DailyAllowance = daysLeft > 0 ? Math.Round(Math.Max(row.Remaining, 0m) / daysLeft, 2, MidpointRounding.ToZero) : null;
            row.UsedPercent = row.Budget > 0 ? Math.Round(row.Used / row.Budget * 100m, 1) : 0m;
        }

        BudgetRowDto Row(int? budgetId, int? personId, string? name, bool isShared, decimal amount, IEnumerable<int> owners)
        {
            var ownerList = owners.ToList();
            var row = new BudgetRowDto
            {
                BudgetId = budgetId,
                PersonId = personId,
                Name = name,
                IsShared = isShared,
                Budget = amount,
                Spent = ownerList.Sum(o => spentByPerson.GetValueOrDefault(o)),
                Pending = ownerList.Sum(o => pendingByPerson.GetValueOrDefault(o))
            };
            FillTotals(row);
            return row;
        }

        // Sahip anahtarı: kişi Id'si, hane (kişisiz) 0
        var allOwners = spentByPerson.Keys.Concat(pendingByPerson.Keys).Distinct().ToList();
        var budgetedPeople = personBudgets.Select(b => b.OwnerPersonId!.Value).ToHashSet();

        var rows = personBudgets
            .Select(b => Row(b.Id, b.OwnerPersonId, b.OwnerPerson?.Name, false, b.Amount, new[] { b.OwnerPersonId!.Value }))
            .ToList();

        BudgetRowDto? householdRow = null;
        var exceeds = false;
        if (household != null)
        {
            householdRow = Row(household.Id, null, null, false, household.Amount, allOwners);

            // Ortak: hane bütçesinden kişi bütçeleri çıkınca kalan; kişisiz ve bütçesi olmayan kişilerin harcamaları
            var personTotal = personBudgets.Sum(b => b.Amount);
            exceeds = personTotal > household.Amount;
            if (personBudgets.Count > 0)
                rows.Add(Row(null, null, null, true, Math.Max(household.Amount - personTotal, 0m),
                    allOwners.Where(o => !budgetedPeople.Contains(o))));
        }

        // Kategori bütçeleri: kategorinin ay harcamaları (yemek kartı hariç) + planı o kategoride olan bekleyen vadeler
        var categoryRows = new List<BudgetRowDto>();
        if (categoryBudgets.Count > 0)
        {
            var spentByCategory = (await _unitOfWork.Expenses.GetTotalsByCategoryAsync(
                    new ExpenseFilter { StartDate = start, EndDate = end }))
                .ToDictionary(r => r.CategoryId, r => r.Total);
            var pendingByCategory = pendingItems
                .Where(i => period.Plans[i.RecurringPaymentId].CategoryId != null)
                .GroupBy(i => period.Plans[i.RecurringPaymentId].CategoryId!.Value)
                .ToDictionary(g => g.Key, g => g.Sum(i => i.Amount ?? 0m));

            foreach (var b in categoryBudgets)
            {
                var categoryId = b.CategoryId!.Value;
                var row = Row(b.Id, null, b.Category?.Name, false, b.Amount, Array.Empty<int>());
                row.CategoryId = categoryId;
                row.CategoryIcon = b.Category?.Icon;
                row.Spent = spentByCategory.GetValueOrDefault(categoryId);
                row.Pending = pendingByCategory.GetValueOrDefault(categoryId);
                FillTotals(row);
                categoryRows.Add(row);
            }
        }

        return Result<BudgetReportDto>.Success(new BudgetReportDto
        {
            Year = year,
            Month = month,
            DaysInMonth = daysInMonth,
            DaysLeft = daysLeft,
            Household = householdRow,
            Rows = rows,
            Categories = categoryRows,
            PersonBudgetsExceedHousehold = exceeds,
            PendingUnknownCount = pendingItems.Count(i => !i.Amount.HasValue),
            Suggestion = await SuggestAsync(year, month, budgetItems.Sum(i => i.Amount ?? 0m))
        });
    }

    // Gelir: Yıllık tablodaki gelir kalemlerinin bu ay girilmiş hücreleri; ay boşsa yılın girilmiş aylarının ortalaması
    private async Task<BudgetSuggestionDto> SuggestAsync(int year, int month, decimal fixedPayments)
    {
        var incomeItemIds = (await _unitOfWork.LedgerItems.GetAllWithOwnerReadOnlyAsync())
            .Where(i => i.Direction == LedgerDirection.Income)
            .Select(i => i.Id)
            .ToHashSet();
        var cells = incomeItemIds.Count == 0
            ? new List<MonthlyAmount>()
            : (await _unitOfWork.MonthlyAmounts.GetByYearReadOnlyAsync(year))
                .Where(a => incomeItemIds.Contains(a.LedgerItemId))
                .ToList();

        decimal? income = null;
        var isAverage = false;
        var monthCells = cells.Where(c => c.Month == month).ToList();
        if (monthCells.Count > 0)
        {
            income = monthCells.Sum(c => c.Amount);
        }
        else if (cells.Count > 0)
        {
            var months = cells.Select(c => c.Month).Distinct().Count();
            income = Math.Round(cells.Sum(c => c.Amount) / months, 2);
            isAverage = true;
        }

        return new BudgetSuggestionDto
        {
            Income = income,
            IncomeIsAverage = isAverage,
            FixedPayments = fixedPayments,
            VariableRoom = income - fixedPayments
        };
    }
}
