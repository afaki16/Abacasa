using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Domain.Entities;
using Abacasa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Abacasa.Infrastructure.Repositories;

public class MarketRateRepository : RepositoryBase<MarketRate, int>, IMarketRateRepository
{
    public MarketRateRepository(ApplicationDbContext context) : base(context) { }

    public async Task<MarketRate?> GetLatestAsync(Currency currency)
    {
        return await _context.Set<MarketRate>()
            .AsNoTracking()
            .Where(r => r.Currency == currency)
            .OrderByDescending(r => r.Date)
            .ThenByDescending(r => r.Id)
            .FirstOrDefaultAsync();
    }

    public async Task<MarketRate?> GetByDateAsync(Currency currency, DateOnly date)
    {
        return await _context.Set<MarketRate>()
            .FirstOrDefaultAsync(r => r.Currency == currency && r.Date == date);
    }
}
