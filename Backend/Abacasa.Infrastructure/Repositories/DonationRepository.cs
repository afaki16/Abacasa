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

public class DonationRepository : RepositoryBase<Donation, int>, IDonationRepository
{
    public DonationRepository(ApplicationDbContext context) : base(context) { }

    private IQueryable<Donation> BuildFilteredQuery(DonationFilter filter)
    {
        var query = _context.Set<Donation>().AsNoTracking();

        if (filter.StartDate.HasValue)
            query = query.Where(d => d.Date >= filter.StartDate.Value);

        if (filter.EndDate.HasValue)
            query = query.Where(d => d.Date <= filter.EndDate.Value);

        if (filter.Kind.HasValue)
            query = query.Where(d => d.Kind == filter.Kind.Value);

        // Kime ve not içinde arar
        if (!string.IsNullOrEmpty(filter.SearchTerm))
        {
            var term = filter.SearchTerm.ToLowerInvariant();
            query = query.Where(d => d.Recipient.ToLower().Contains(term) ||
                (d.Note != null && d.Note.ToLower().Contains(term)));
        }

        if (filter.FundId.HasValue)
            query = query.Where(d => d.FundId == filter.FundId.Value);

        return query;
    }

    // Toplamlar: emanetten dağıtılan bağışlar (FundId dolu) hiçbir toplama girmez
    private IQueryable<Donation> BuildTotalsQuery(DonationFilter filter) =>
        BuildFilteredQuery(filter).Where(d => d.FundId == null);

    public async Task<(IEnumerable<Donation> Donations, int TotalCount)> GetDonationsPagedAsync(
        int page, int pageSize, DonationFilter filter)
    {
        var query = BuildFilteredQuery(filter);

        var totalCount = await query.CountAsync();

        var donations = await query
            .Include(d => d.PaymentMethod)
            .Include(d => d.GiverPerson)
            .Include(d => d.Fund).ThenInclude(f => f!.FromPerson)
            .OrderByDescending(d => d.Date)
            .ThenByDescending(d => d.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (donations, totalCount);
    }

    public async Task<Donation> GetWithRelationsAsync(int id)
    {
        return await _context.Set<Donation>()
            .Include(d => d.PaymentMethod)
            .Include(d => d.GiverPerson)
            .Include(d => d.Fund).ThenInclude(f => f!.FromPerson)
            .FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<Donation> GetWithRelationsReadOnlyAsync(int id)
    {
        return await _context.Set<Donation>()
            .AsNoTracking()
            .Include(d => d.PaymentMethod)
            .Include(d => d.GiverPerson)
            .Include(d => d.Fund).ThenInclude(f => f!.FromPerson)
            .FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<(decimal Total, int Count)> GetTotalsAsync(DonationFilter filter)
    {
        var totals = await BuildTotalsQuery(filter)
            .GroupBy(d => 1)
            .Select(g => new { Total = g.Sum(d => d.Amount), Count = g.Count() })
            .FirstOrDefaultAsync();

        return totals == null ? (0m, 0) : (totals.Total, totals.Count);
    }

    public async Task<List<(DonationKind Kind, decimal Total, int Count)>> GetTotalsByKindAsync(DonationFilter filter)
    {
        var rows = await BuildTotalsQuery(filter)
            .GroupBy(d => d.Kind)
            .Select(g => new { Kind = g.Key, Total = g.Sum(d => d.Amount), Count = g.Count() })
            .OrderByDescending(x => x.Total)
            .ToListAsync();

        return rows.Select(r => (r.Kind, r.Total, r.Count)).ToList();
    }

    public async Task<List<(int? PersonId, string? PersonName, decimal Total, int Count)>> GetTotalsByGiverAsync(DonationFilter filter)
    {
        var rows = await BuildTotalsQuery(filter)
            .GroupBy(d => new { d.GiverPersonId, Name = d.GiverPerson != null ? d.GiverPerson.Name : null })
            .Select(g => new { g.Key.GiverPersonId, g.Key.Name, Total = g.Sum(d => d.Amount), Count = g.Count() })
            .OrderByDescending(x => x.Total)
            .ToListAsync();

        return rows.Select(r => (r.GiverPersonId, r.Name, r.Total, r.Count)).ToList();
    }

    public async Task<List<SpendingTotal>> GetTotalsByPaymentMethodAndPersonAsync(DonationFilter filter)
    {
        return await BuildTotalsQuery(filter)
            .GroupBy(d => new
            {
                d.PaymentMethodId,
                PaymentMethodName = d.PaymentMethod.Name,
                d.PaymentMethod.Type,
                d.GiverPersonId,
                PersonName = d.GiverPerson != null ? d.GiverPerson.Name : null
            })
            .Select(g => new SpendingTotal
            {
                PaymentMethodId = g.Key.PaymentMethodId,
                PaymentMethodName = g.Key.PaymentMethodName,
                PaymentMethodType = g.Key.Type,
                PersonId = g.Key.GiverPersonId,
                PersonName = g.Key.PersonName,
                Total = g.Sum(d => d.Amount)
            })
            .ToListAsync();
    }

    public async Task<List<(int RecurringPaymentId, int Month, decimal Total)>> GetPlanMonthTotalsAsync(int year)
    {
        var from = new DateOnly(year, 1, 1);
        var to = new DateOnly(year, 12, 31);

        var rows = await _context.Set<Donation>()
            .AsNoTracking()
            .Where(d => d.RecurringPaymentId != null &&
                d.RecurringPaymentMonth >= from && d.RecurringPaymentMonth <= to &&
                d.PaymentMethod.Type != PaymentMethodType.MealCard)
            .GroupBy(d => new { RecurringPaymentId = d.RecurringPaymentId!.Value, d.RecurringPaymentMonth!.Value.Month })
            .Select(g => new { g.Key.RecurringPaymentId, g.Key.Month, Total = g.Sum(d => d.Amount) })
            .ToListAsync();

        return rows.Select(r => (r.RecurringPaymentId, r.Month, r.Total)).ToList();
    }

    public async Task<List<(int Month, decimal Total)>> GetUnplannedMonthTotalsAsync(int year)
    {
        var from = new DateOnly(year, 1, 1);
        var to = new DateOnly(year, 12, 31);

        var rows = await _context.Set<Donation>()
            .AsNoTracking()
            .Where(d => d.RecurringPaymentId == null && d.FundId == null &&
                d.Date >= from && d.Date <= to &&
                d.PaymentMethod.Type != PaymentMethodType.MealCard)
            .GroupBy(d => d.Date.Month)
            .Select(g => new { Month = g.Key, Total = g.Sum(d => d.Amount) })
            .ToListAsync();

        return rows.Select(r => (r.Month, r.Total)).ToList();
    }

    public async Task<(decimal Total, int Count)> GetFundDistributedTotalsAsync(DonationFilter filter)
    {
        var totals = await BuildFilteredQuery(filter)
            .Where(d => d.FundId != null)
            .GroupBy(d => 1)
            .Select(g => new { Total = g.Sum(d => d.Amount), Count = g.Count() })
            .FirstOrDefaultAsync();

        return totals == null ? (0m, 0) : (totals.Total, totals.Count);
    }

    public async Task<List<(int? PersonId, string? PersonName, DonationKind Kind, decimal Total)>> GetYearTotalsByGiverAndKindAsync(int year)
    {
        var rows = await BuildTotalsQuery(new DonationFilter { StartDate = new DateOnly(year, 1, 1), EndDate = new DateOnly(year, 12, 31) })
            .GroupBy(d => new { d.GiverPersonId, Name = d.GiverPerson != null ? d.GiverPerson.Name : null, d.Kind })
            .Select(g => new { g.Key.GiverPersonId, g.Key.Name, g.Key.Kind, Total = g.Sum(d => d.Amount) })
            .ToListAsync();

        return rows.Select(r => (r.GiverPersonId, r.Name, r.Kind, r.Total)).ToList();
    }
}
