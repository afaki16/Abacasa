using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using Abacasa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Abacasa.Infrastructure.Repositories;

public class LedgerItemRepository : RepositoryBase<LedgerItem, int>, ILedgerItemRepository
{
    public LedgerItemRepository(ApplicationDbContext context) : base(context) { }

    public async Task<bool> NameExistsAsync(string name, int? excludeId = null)
    {
        var normalizedName = name.Trim().ToLowerInvariant();

        var query = _context.Set<LedgerItem>()
            .Where(li => li.Name.ToLower() == normalizedName);

        if (excludeId.HasValue)
            query = query.Where(li => li.Id != excludeId.Value);

        return await query.AnyAsync();
    }

    public async Task<(IEnumerable<LedgerItem> LedgerItems, int TotalCount)> GetLedgerItemsPagedAsync(
        int page, int pageSize, LedgerItemFilter filter)
    {
        var query = _context.Set<LedgerItem>().AsNoTracking();

        if (filter.Direction.HasValue)
            query = query.Where(li => li.Direction == filter.Direction.Value);

        if (filter.IsActive.HasValue)
            query = query.Where(li => li.IsActive == filter.IsActive.Value);

        if (!string.IsNullOrEmpty(filter.SearchTerm))
            query = query.Where(li => li.Name.ToLower().Contains(filter.SearchTerm.ToLowerInvariant()));

        var totalCount = await query.CountAsync();

        var ledgerItems = await query
            .Include(li => li.OwnerPerson)
            .OrderBy(li => li.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (ledgerItems, totalCount);
    }

    public async Task<LedgerItem> GetWithOwnerAsync(int id)
    {
        return await _context.Set<LedgerItem>()
            .Include(li => li.OwnerPerson)
            .FirstOrDefaultAsync(li => li.Id == id);
    }

    public async Task<LedgerItem> GetWithOwnerReadOnlyAsync(int id)
    {
        return await _context.Set<LedgerItem>()
            .AsNoTracking()
            .Include(li => li.OwnerPerson)
            .FirstOrDefaultAsync(li => li.Id == id);
    }

    public async Task<List<LedgerItem>> GetAllWithOwnerReadOnlyAsync()
    {
        return await _context.Set<LedgerItem>()
            .AsNoTracking()
            .Include(li => li.OwnerPerson)
            .ToListAsync();
    }

    public async Task<bool> HasAmountsAsync(int ledgerItemId)
    {
        return await _context.Set<MonthlyAmount>().AnyAsync(ma => ma.LedgerItemId == ledgerItemId);
    }

    public async Task<HashSet<int>> GetIdsWithAmountsAsync(IEnumerable<int> ledgerItemIds)
    {
        var ids = ledgerItemIds.ToList();

        var withAmounts = await _context.Set<MonthlyAmount>()
            .Where(ma => ids.Contains(ma.LedgerItemId))
            .Select(ma => ma.LedgerItemId)
            .Distinct()
            .ToListAsync();

        return withAmounts.ToHashSet();
    }
}
