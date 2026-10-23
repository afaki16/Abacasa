using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Domain.Entities;
using Abacasa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Abacasa.Infrastructure.Repositories;

public class ExchangeRateRepository : RepositoryBase<ExchangeRate, int>, IExchangeRateRepository
{
    public ExchangeRateRepository(ApplicationDbContext context) : base(context) { }

    public async Task<ExchangeRate?> GetLatestAsync(Currency currency)
    {
        return await _context.Set<ExchangeRate>()
            .AsNoTracking()
            .Where(r => r.Currency == currency)
            .OrderByDescending(r => r.Date)
            .ThenByDescending(r => r.Id)
            .FirstOrDefaultAsync();
    }

    public async Task<ExchangeRate?> GetByDateAsync(Currency currency, DateOnly date)
    {
        return await _context.Set<ExchangeRate>()
            .FirstOrDefaultAsync(r => r.Currency == currency && r.Date == date);
    }

    public async Task<List<ExchangeRate>> GetRecentAsync(Currency? currency, int count)
    {
        var query = _context.Set<ExchangeRate>().AsNoTracking();

        if (currency.HasValue)
            query = query.Where(r => r.Currency == currency.Value);

        return await query
            .OrderByDescending(r => r.Date)
            .ThenByDescending(r => r.Id)
            .Take(count)
            .ToListAsync();
    }
}
