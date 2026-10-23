using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using Abacasa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Abacasa.Infrastructure.Repositories;

public class RecurringPaymentRepository : RepositoryBase<RecurringPayment, int>, IRecurringPaymentRepository
{
    public RecurringPaymentRepository(ApplicationDbContext context) : base(context) { }

    public async Task<bool> NameExistsAsync(string name, int? excludeId = null)
    {
        var normalizedName = name.Trim().ToLowerInvariant();

        var query = _context.Set<RecurringPayment>()
            .Where(rp => rp.Name.ToLower() == normalizedName);

        if (excludeId.HasValue)
            query = query.Where(rp => rp.Id != excludeId.Value);

        return await query.AnyAsync();
    }

    public async Task<(IEnumerable<RecurringPayment> RecurringPayments, int TotalCount)> GetRecurringPaymentsPagedAsync(
        int page, int pageSize, RecurringPaymentFilter filter)
    {
        var query = _context.Set<RecurringPayment>().AsNoTracking();

        if (filter.Kind.HasValue)
            query = query.Where(rp => rp.Kind == filter.Kind.Value);

        if (filter.IsActive.HasValue)
            query = query.Where(rp => rp.IsActive == filter.IsActive.Value);

        // Ad ve Kime içinde arar
        if (!string.IsNullOrEmpty(filter.SearchTerm))
        {
            var term = filter.SearchTerm.ToLowerInvariant();
            query = query.Where(rp => rp.Name.ToLower().Contains(term) ||
                (rp.Recipient != null && rp.Recipient.ToLower().Contains(term)));
        }

        var totalCount = await query.CountAsync();

        var recurringPayments = await query
            .Include(rp => rp.PaymentMethod)
            .Include(rp => rp.Category)
            .Include(rp => rp.OwnerPerson)
            .OrderBy(rp => rp.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (recurringPayments, totalCount);
    }

    public async Task<RecurringPayment> GetWithRelationsAsync(int id)
    {
        return await _context.Set<RecurringPayment>()
            .Include(rp => rp.PaymentMethod)
            .Include(rp => rp.Category)
            .Include(rp => rp.OwnerPerson)
            .FirstOrDefaultAsync(rp => rp.Id == id);
    }

    public async Task<RecurringPayment> GetWithRelationsReadOnlyAsync(int id)
    {
        return await _context.Set<RecurringPayment>()
            .AsNoTracking()
            .Include(rp => rp.PaymentMethod)
            .Include(rp => rp.Category)
            .Include(rp => rp.OwnerPerson)
            .FirstOrDefaultAsync(rp => rp.Id == id);
    }

    public async Task<List<RecurringPayment>> GetAllWithRelationsReadOnlyAsync()
    {
        return await _context.Set<RecurringPayment>()
            .AsNoTracking()
            .Include(rp => rp.PaymentMethod)
            .Include(rp => rp.Category)
            .Include(rp => rp.OwnerPerson)
            .ToListAsync();
    }

    public async Task<bool> HasPaymentsAsync(int recurringPaymentId)
    {
        return await _context.Set<Expense>().AnyAsync(e => e.RecurringPaymentId == recurringPaymentId)
            || await _context.Set<Donation>().AnyAsync(d => d.RecurringPaymentId == recurringPaymentId);
    }

    public async Task<HashSet<int>> GetIdsWithPaymentsAsync(IEnumerable<int> recurringPaymentIds)
    {
        var ids = recurringPaymentIds.ToList();

        var fromExpenses = await _context.Set<Expense>()
            .Where(e => e.RecurringPaymentId != null && ids.Contains(e.RecurringPaymentId.Value))
            .Select(e => e.RecurringPaymentId!.Value)
            .Distinct()
            .ToListAsync();

        var fromDonations = await _context.Set<Donation>()
            .Where(d => d.RecurringPaymentId != null && ids.Contains(d.RecurringPaymentId.Value))
            .Select(d => d.RecurringPaymentId!.Value)
            .Distinct()
            .ToListAsync();

        return fromExpenses.Concat(fromDonations).ToHashSet();
    }

    public async Task<bool> IsMonthPaidAsync(int recurringPaymentId, DateOnly month)
    {
        return await _context.Set<Expense>().AnyAsync(e => e.RecurringPaymentId == recurringPaymentId && e.RecurringPaymentMonth == month)
            || await _context.Set<Donation>().AnyAsync(d => d.RecurringPaymentId == recurringPaymentId && d.RecurringPaymentMonth == month);
    }

    public async Task<List<RecurringPaymentRecord>> GetPaymentRecordsAsync(DateOnly fromMonth, DateOnly toMonth)
    {
        var expenses = await _context.Set<Expense>()
            .AsNoTracking()
            .Where(e => e.RecurringPaymentId != null &&
                e.RecurringPaymentMonth >= fromMonth && e.RecurringPaymentMonth <= toMonth)
            .Select(e => new RecurringPaymentRecord
            {
                RecurringPaymentId = e.RecurringPaymentId!.Value,
                Month = e.RecurringPaymentMonth!.Value,
                Date = e.Date,
                Amount = e.Amount,
                PaymentMethodId = e.PaymentMethodId,
                PaymentMethodName = e.PaymentMethod.Name,
                PaymentMethodType = e.PaymentMethod.Type,
                ExpenseId = e.Id
            })
            .ToListAsync();

        var donations = await _context.Set<Donation>()
            .AsNoTracking()
            .Where(d => d.RecurringPaymentId != null &&
                d.RecurringPaymentMonth >= fromMonth && d.RecurringPaymentMonth <= toMonth)
            .Select(d => new RecurringPaymentRecord
            {
                RecurringPaymentId = d.RecurringPaymentId!.Value,
                Month = d.RecurringPaymentMonth!.Value,
                Date = d.Date,
                Amount = d.Amount,
                PaymentMethodId = d.PaymentMethodId,
                PaymentMethodName = d.PaymentMethod.Name,
                PaymentMethodType = d.PaymentMethod.Type,
                DonationId = d.Id
            })
            .ToListAsync();

        return expenses.Concat(donations).ToList();
    }

    public async Task<Dictionary<int, decimal>> GetLastPaidAmountsAsync()
    {
        var fromExpenses = await _context.Set<Expense>()
            .AsNoTracking()
            .Where(e => e.RecurringPaymentId != null)
            .GroupBy(e => e.RecurringPaymentId!.Value)
            .Select(g => new
            {
                Id = g.Key,
                Amount = g.OrderByDescending(e => e.RecurringPaymentMonth).ThenByDescending(e => e.Id).Select(e => e.Amount).First()
            })
            .ToListAsync();

        var fromDonations = await _context.Set<Donation>()
            .AsNoTracking()
            .Where(d => d.RecurringPaymentId != null)
            .GroupBy(d => d.RecurringPaymentId!.Value)
            .Select(g => new
            {
                Id = g.Key,
                Amount = g.OrderByDescending(d => d.RecurringPaymentMonth).ThenByDescending(d => d.Id).Select(d => d.Amount).First()
            })
            .ToListAsync();

        // Bir planın kayıtları türüne göre tek tabloda olur
        var result = new Dictionary<int, decimal>();
        foreach (var row in fromExpenses.Concat(fromDonations))
            result[row.Id] = row.Amount;

        return result;
    }
}
