using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Domain.Entities;
using Abacasa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Abacasa.Infrastructure.Repositories;

public class BudgetRepository : RepositoryBase<Budget, int>, IBudgetRepository
{
    public BudgetRepository(ApplicationDbContext context) : base(context) { }

    public async Task<bool> ExistsAsync(int? ownerPersonId, int startYear, int startMonth, int? excludeId = null)
    {
        // Kişi boşsa (hane) IS NULL ile karşılaştırılır; veritabanı index'i NULL'ları farklı sayardı
        var query = _context.Set<Budget>()
            .Where(b => b.StartYear == startYear && b.StartMonth == startMonth);

        query = ownerPersonId.HasValue
            ? query.Where(b => b.OwnerPersonId == ownerPersonId.Value)
            : query.Where(b => b.OwnerPersonId == null);

        if (excludeId.HasValue)
            query = query.Where(b => b.Id != excludeId.Value);

        return await query.AnyAsync();
    }

    public async Task<(IEnumerable<Budget> Budgets, int TotalCount)> GetBudgetsPagedAsync(int page, int pageSize)
    {
        var query = _context.Set<Budget>().AsNoTracking();

        var totalCount = await query.CountAsync();

        // Hane önce, sonra kişi adı; her sahipte en yeni başlangıç önce
        var budgets = await query
            .Include(b => b.OwnerPerson)
            .OrderBy(b => b.OwnerPerson != null)
            .ThenBy(b => b.OwnerPerson!.Name)
            .ThenBy(b => b.OwnerPersonId)
            .ThenByDescending(b => b.StartYear)
            .ThenByDescending(b => b.StartMonth)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (budgets, totalCount);
    }

    public async Task<Budget> GetWithOwnerAsync(int id)
    {
        return await _context.Set<Budget>()
            .Include(b => b.OwnerPerson)
            .FirstOrDefaultAsync(b => b.Id == id);
    }

    public async Task<Budget> GetWithOwnerReadOnlyAsync(int id)
    {
        return await _context.Set<Budget>()
            .AsNoTracking()
            .Include(b => b.OwnerPerson)
            .FirstOrDefaultAsync(b => b.Id == id);
    }

    public async Task<List<Budget>> GetStartedByReadOnlyAsync(int year, int month)
    {
        return await _context.Set<Budget>()
            .AsNoTracking()
            .Include(b => b.OwnerPerson)
            .Where(b => b.StartYear < year || (b.StartYear == year && b.StartMonth <= month))
            .ToListAsync();
    }
}
