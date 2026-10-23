using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Domain.Entities;
using Abacasa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Abacasa.Infrastructure.Repositories;

public class MonthlyAmountRepository : RepositoryBase<MonthlyAmount, int>, IMonthlyAmountRepository
{
    public MonthlyAmountRepository(ApplicationDbContext context) : base(context) { }

    public async Task<MonthlyAmount?> GetAsync(int ledgerItemId, int year, int month)
    {
        return await _context.Set<MonthlyAmount>()
            .FirstOrDefaultAsync(ma => ma.LedgerItemId == ledgerItemId && ma.Year == year && ma.Month == month);
    }

    public async Task<List<MonthlyAmount>> GetByYearReadOnlyAsync(int year)
    {
        return await _context.Set<MonthlyAmount>()
            .AsNoTracking()
            .Where(ma => ma.Year == year)
            .ToListAsync();
    }
}
