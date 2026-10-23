using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using Abacasa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Abacasa.Infrastructure.Repositories;

public class DebtRepository : RepositoryBase<Debt, int>, IDebtRepository
{
    public DebtRepository(ApplicationDbContext context) : base(context) { }

    public async Task<(IEnumerable<Debt> Debts, int TotalCount)> GetDebtsPagedAsync(
        int page, int pageSize, DebtFilter filter)
    {
        var query = _context.Set<Debt>().AsNoTracking();

        // Kapanma durumu saklanmaz; ödemeler toplamından SQL'de hesaplanır (silinmiş ödemeler filtreyle dışarıda)
        if (filter.IsClosed.HasValue)
            query = filter.IsClosed.Value
                ? query.Where(d => d.Payments.Sum(p => p.Amount) >= d.Amount)
                : query.Where(d => d.Payments.Sum(p => p.Amount) < d.Amount);

        if (filter.CreditorPersonId.HasValue)
            query = query.Where(d => d.CreditorPersonId == filter.CreditorPersonId.Value);

        if (filter.Currency.HasValue)
            query = query.Where(d => d.Currency == filter.Currency.Value);

        // Not içinde arar
        if (!string.IsNullOrEmpty(filter.SearchTerm))
        {
            var term = filter.SearchTerm.ToLowerInvariant();
            query = query.Where(d => d.Note != null && d.Note.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync();

        var debts = await query
            .Include(d => d.CreditorPerson)
            .Include(d => d.DebtorPerson)
            .Include(d => d.Payments)
            .OrderByDescending(d => d.Date)
            .ThenByDescending(d => d.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (debts, totalCount);
    }

    public async Task<Debt> GetWithRelationsAsync(int id)
    {
        return await _context.Set<Debt>()
            .Include(d => d.CreditorPerson)
            .Include(d => d.DebtorPerson)
            .Include(d => d.Payments)
            .FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<Debt> GetWithRelationsReadOnlyAsync(int id)
    {
        return await _context.Set<Debt>()
            .AsNoTracking()
            .Include(d => d.CreditorPerson)
            .Include(d => d.DebtorPerson)
            .Include(d => d.Payments)
            .FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<List<Debt>> GetAllWithPaymentsReadOnlyAsync()
    {
        return await _context.Set<Debt>()
            .AsNoTracking()
            .Include(d => d.CreditorPerson)
            .Include(d => d.Payments)
            .ToListAsync();
    }
}
