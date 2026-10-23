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

public class DonationFundRepository : RepositoryBase<DonationFund, int>, IDonationFundRepository
{
    public DonationFundRepository(ApplicationDbContext context) : base(context) { }

    public async Task<(IEnumerable<DonationFund> Funds, int TotalCount)> GetFundsPagedAsync(int page, int pageSize, DonationFundFilter filter)
    {
        var query = _context.Set<DonationFund>().AsNoTracking();

        // Kapanma durumu saklanmaz; bağlı canlı bağışlardan SQL'de hesaplanır (kalan == 0)
        if (filter.IsClosed.HasValue)
            query = filter.IsClosed.Value
                ? query.Where(f => f.Distributions.Sum(d => d.Amount) >= f.Amount)
                : query.Where(f => f.Distributions.Sum(d => d.Amount) < f.Amount);

        // Not ve veren kişi adı içinde arar
        if (!string.IsNullOrEmpty(filter.SearchTerm))
        {
            var term = filter.SearchTerm.ToLowerInvariant();
            query = query.Where(f => f.FromPerson.Name.ToLower().Contains(term) ||
                (f.Note != null && f.Note.ToLower().Contains(term)));
        }

        var totalCount = await query.CountAsync();

        var funds = await query
            .Include(f => f.FromPerson)
            .OrderByDescending(f => f.Date)
            .ThenByDescending(f => f.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (funds, totalCount);
    }

    public async Task<DonationFund> GetWithPersonAsync(int id)
    {
        return await _context.Set<DonationFund>()
            .Include(f => f.FromPerson)
            .FirstOrDefaultAsync(f => f.Id == id);
    }

    public async Task<DonationFund> GetWithPersonReadOnlyAsync(int id)
    {
        return await _context.Set<DonationFund>()
            .AsNoTracking()
            .Include(f => f.FromPerson)
            .FirstOrDefaultAsync(f => f.Id == id);
    }

    public async Task<Dictionary<int, FundTotals>> GetTotalsAsync(IEnumerable<int> fundIds, int? excludeDonationId = null, int? excludeMovementId = null)
    {
        var ids = fundIds.Distinct().ToList();

        var distributions = await _context.Set<Donation>()
            .AsNoTracking()
            .Where(d => d.FundId != null && ids.Contains(d.FundId.Value) && d.Id != excludeDonationId)
            .GroupBy(d => d.FundId!.Value)
            .Select(g => new { FundId = g.Key, Total = g.Sum(d => d.Amount), Count = g.Count() })
            .ToListAsync();

        var movements = await _context.Set<FundMovement>()
            .AsNoTracking()
            .Where(m => ids.Contains(m.FundId) && m.Id != excludeMovementId)
            .GroupBy(m => m.FundId)
            .Select(g => new
            {
                FundId = g.Key,
                Uses = g.Sum(m => m.Type == FundMovementType.Use ? m.Amount : 0m),
                Returns = g.Sum(m => m.Type == FundMovementType.Return ? m.Amount : 0m),
                Count = g.Count()
            })
            .ToListAsync();

        var result = ids.ToDictionary(id => id, id => new FundTotals { FundId = id });
        foreach (var d in distributions)
        {
            result[d.FundId].Distributed = d.Total;
            result[d.FundId].DistributionCount = d.Count;
        }
        foreach (var m in movements)
        {
            result[m.FundId].Uses = m.Uses;
            result[m.FundId].Returns = m.Returns;
            result[m.FundId].MovementCount = m.Count;
        }

        return result;
    }

    public async Task<List<FundMovement>> GetMovementsReadOnlyAsync(int fundId)
    {
        return await _context.Set<FundMovement>()
            .AsNoTracking()
            .Where(m => m.FundId == fundId)
            .OrderBy(m => m.Date)
            .ThenBy(m => m.Id)
            .ToListAsync();
    }
}
