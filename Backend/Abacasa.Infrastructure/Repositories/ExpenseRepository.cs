using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using Abacasa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Abacasa.Infrastructure.Repositories;

public class ExpenseRepository : RepositoryBase<Expense, int>, IExpenseRepository
{
    public ExpenseRepository(ApplicationDbContext context) : base(context) { }

    private IQueryable<Expense> BuildFilteredQuery(ExpenseFilter filter)
    {
        var query = _context.Set<Expense>().AsNoTracking();

        if (filter.StartDate.HasValue)
            query = query.Where(e => e.Date >= filter.StartDate.Value);

        if (filter.EndDate.HasValue)
            query = query.Where(e => e.Date <= filter.EndDate.Value);

        if (filter.CategoryId.HasValue)
            query = query.Where(e => e.CategoryId == filter.CategoryId.Value);

        if (filter.PaymentMethodId.HasValue)
            query = query.Where(e => e.PaymentMethodId == filter.PaymentMethodId.Value);

        if (filter.OwnerPersonId.HasValue)
            query = query.Where(e => e.OwnerPersonId == filter.OwnerPersonId.Value);

        if (!string.IsNullOrEmpty(filter.SearchTerm))
            query = query.Where(e => e.Description != null &&
                e.Description.ToLower().Contains(filter.SearchTerm.ToLowerInvariant()));

        return query;
    }

    public async Task<(IEnumerable<Expense> Expenses, int TotalCount)> GetExpensesPagedAsync(
        int page, int pageSize, ExpenseFilter filter)
    {
        var query = BuildFilteredQuery(filter);

        var totalCount = await query.CountAsync();

        var expenses = await query
            .Include(e => e.Category)
            .Include(e => e.PaymentMethod)
            .Include(e => e.OwnerPerson)
            .OrderByDescending(e => e.Date)
            .ThenByDescending(e => e.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (expenses, totalCount);
    }

    public async Task<Expense> GetWithRelationsAsync(int id)
    {
        return await _context.Set<Expense>()
            .Include(e => e.Category)
            .Include(e => e.PaymentMethod)
            .Include(e => e.OwnerPerson)
            .FirstOrDefaultAsync(e => e.Id == id);
    }

    public async Task<Expense> GetWithRelationsReadOnlyAsync(int id)
    {
        return await _context.Set<Expense>()
            .AsNoTracking()
            .Include(e => e.Category)
            .Include(e => e.PaymentMethod)
            .Include(e => e.OwnerPerson)
            .FirstOrDefaultAsync(e => e.Id == id);
    }

    public async Task<(decimal Total, decimal MealCardTotal, int Count)> GetTotalsAsync(ExpenseFilter filter)
    {
        var totals = await BuildFilteredQuery(filter)
            .Select(e => new { e.Amount, IsMealCard = e.PaymentMethod.Type == PaymentMethodType.MealCard })
            .GroupBy(x => 1)
            .Select(g => new
            {
                Total = g.Sum(x => x.IsMealCard ? 0m : x.Amount),
                MealCardTotal = g.Sum(x => x.IsMealCard ? x.Amount : 0m),
                Count = g.Count()
            })
            .FirstOrDefaultAsync();

        return totals == null ? (0m, 0m, 0) : (totals.Total, totals.MealCardTotal, totals.Count);
    }

    public async Task<List<(int CategoryId, string CategoryName, decimal Total)>> GetTotalsByCategoryAsync(ExpenseFilter filter)
    {
        var rows = await BuildFilteredQuery(filter)
            .Where(e => e.PaymentMethod.Type != PaymentMethodType.MealCard)
            .GroupBy(e => new { e.CategoryId, e.Category.Name })
            .Select(g => new { g.Key.CategoryId, g.Key.Name, Total = g.Sum(e => e.Amount) })
            .OrderByDescending(x => x.Total)
            .ToListAsync();

        return rows.Select(r => (r.CategoryId, r.Name, r.Total)).ToList();
    }

    public async Task<List<(int PaymentMethodId, string PaymentMethodName, PaymentMethodType Type, decimal Total)>> GetTotalsByPaymentMethodAsync(ExpenseFilter filter)
    {
        var rows = await BuildFilteredQuery(filter)
            .GroupBy(e => new { e.PaymentMethodId, e.PaymentMethod.Name, e.PaymentMethod.Type })
            .Select(g => new { g.Key.PaymentMethodId, g.Key.Name, g.Key.Type, Total = g.Sum(e => e.Amount) })
            .OrderByDescending(x => x.Total)
            .ToListAsync();

        return rows.Select(r => (r.PaymentMethodId, r.Name, r.Type, r.Total)).ToList();
    }

    public async Task<List<SpendingTotal>> GetTotalsByPaymentMethodAndPersonAsync(ExpenseFilter filter)
    {
        return await BuildFilteredQuery(filter)
            .GroupBy(e => new
            {
                e.PaymentMethodId,
                PaymentMethodName = e.PaymentMethod.Name,
                e.PaymentMethod.Type,
                e.OwnerPersonId,
                PersonName = e.OwnerPerson != null ? e.OwnerPerson.Name : null
            })
            .Select(g => new SpendingTotal
            {
                PaymentMethodId = g.Key.PaymentMethodId,
                PaymentMethodName = g.Key.PaymentMethodName,
                PaymentMethodType = g.Key.Type,
                PersonId = g.Key.OwnerPersonId,
                PersonName = g.Key.PersonName,
                Total = g.Sum(e => e.Amount)
            })
            .ToListAsync();
    }

    public async Task<List<(int RecurringPaymentId, int Month, decimal Total)>> GetPlanMonthTotalsAsync(int year)
    {
        var from = new DateOnly(year, 1, 1);
        var to = new DateOnly(year, 12, 31);

        var rows = await _context.Set<Expense>()
            .AsNoTracking()
            .Where(e => e.RecurringPaymentId != null &&
                e.RecurringPaymentMonth >= from && e.RecurringPaymentMonth <= to &&
                e.PaymentMethod.Type != PaymentMethodType.MealCard)
            .GroupBy(e => new { RecurringPaymentId = e.RecurringPaymentId!.Value, e.RecurringPaymentMonth!.Value.Month })
            .Select(g => new { g.Key.RecurringPaymentId, g.Key.Month, Total = g.Sum(e => e.Amount) })
            .ToListAsync();

        return rows.Select(r => (r.RecurringPaymentId, r.Month, r.Total)).ToList();
    }

    public async Task<List<(int CategoryId, string CategoryName, int Month, decimal Total)>> GetUnplannedCategoryMonthTotalsAsync(int year)
    {
        var from = new DateOnly(year, 1, 1);
        var to = new DateOnly(year, 12, 31);

        var rows = await _context.Set<Expense>()
            .AsNoTracking()
            .Where(e => e.RecurringPaymentId == null &&
                e.Date >= from && e.Date <= to &&
                e.PaymentMethod.Type != PaymentMethodType.MealCard)
            .GroupBy(e => new { e.CategoryId, e.Category.Name, e.Date.Month })
            .Select(g => new { g.Key.CategoryId, g.Key.Name, g.Key.Month, Total = g.Sum(e => e.Amount) })
            .ToListAsync();

        return rows.Select(r => (r.CategoryId, r.Name, r.Month, r.Total)).ToList();
    }
}
