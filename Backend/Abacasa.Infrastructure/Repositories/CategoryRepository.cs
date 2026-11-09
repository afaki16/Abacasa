using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Domain.Entities;
using Abacasa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Abacasa.Infrastructure.Repositories;

public class CategoryRepository : RepositoryBase<Category, int>, ICategoryRepository
{
    public CategoryRepository(ApplicationDbContext context) : base(context) { }

    public async Task<bool> NameExistsAsync(string name, int? excludeId = null)
    {
        var normalizedName = name.Trim().ToLowerInvariant();

        var query = _context.Set<Category>()
            .Where(c => c.Name.ToLower() == normalizedName);

        if (excludeId.HasValue)
            query = query.Where(c => c.Id != excludeId.Value);

        return await query.AnyAsync();
    }

    public async Task<(IEnumerable<Category> Categories, int TotalCount)> GetCategoriesPagedAsync(
        int page, int pageSize, string searchTerm = null)
    {
        var query = _context.Set<Category>().AsNoTracking();

        if (!string.IsNullOrEmpty(searchTerm))
            query = query.Where(c => c.Name.ToLower().Contains(searchTerm.ToLowerInvariant()));

        var totalCount = await query.CountAsync();

        var categories = await query
            .OrderBy(c => c.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (categories, totalCount);
    }

    public async Task<Category> GetByIdReadOnlyAsync(int id)
    {
        return await _context.Set<Category>()
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<bool> IsInUseAsync(int categoryId)
    {
        return await _context.Set<Expense>().AnyAsync(e => e.CategoryId == categoryId)
            || await _context.Set<RecurringPayment>().AnyAsync(rp => rp.CategoryId == categoryId);
    }

    public async Task<Dictionary<int, int>> GetUsageCountsAsync(IEnumerable<int> categoryIds)
    {
        var ids = categoryIds.ToList();

        var expenses = await _context.Set<Expense>()
            .Where(e => ids.Contains(e.CategoryId))
            .GroupBy(e => e.CategoryId)
            .Select(g => new { Id = g.Key, Count = g.Count() })
            .ToListAsync();

        var plans = await _context.Set<RecurringPayment>()
            .Where(rp => rp.CategoryId.HasValue && ids.Contains(rp.CategoryId.Value))
            .GroupBy(rp => rp.CategoryId!.Value)
            .Select(g => new { Id = g.Key, Count = g.Count() })
            .ToListAsync();

        return expenses.Concat(plans)
            .GroupBy(x => x.Id)
            .ToDictionary(g => g.Key, g => g.Sum(x => x.Count));
    }
}
