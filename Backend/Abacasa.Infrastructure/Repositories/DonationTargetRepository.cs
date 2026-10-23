using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Domain.Entities;
using Abacasa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Abacasa.Infrastructure.Repositories;

public class DonationTargetRepository : RepositoryBase<DonationTarget, int>, IDonationTargetRepository
{
    public DonationTargetRepository(ApplicationDbContext context) : base(context) { }

    public async Task<bool> ExistsAsync(int? ownerPersonId, int year, DonationKind kind, int? excludeId = null)
    {
        // Kişi boşsa (hane) IS NULL ile karşılaştırılır; veritabanı index'i NULL'ları farklı sayardı
        var query = _context.Set<DonationTarget>()
            .Where(t => t.Year == year && t.Kind == kind);

        query = ownerPersonId.HasValue
            ? query.Where(t => t.OwnerPersonId == ownerPersonId.Value)
            : query.Where(t => t.OwnerPersonId == null);

        if (excludeId.HasValue)
            query = query.Where(t => t.Id != excludeId.Value);

        return await query.AnyAsync();
    }

    public async Task<(IEnumerable<DonationTarget> Targets, int TotalCount)> GetTargetsPagedAsync(int page, int pageSize, int? year)
    {
        var query = _context.Set<DonationTarget>().AsNoTracking();

        if (year.HasValue)
            query = query.Where(t => t.Year == year.Value);

        var totalCount = await query.CountAsync();

        var targets = await query
            .Include(t => t.OwnerPerson)
            .OrderByDescending(t => t.Year)
            .ThenBy(t => t.Kind)
            .ThenBy(t => t.OwnerPerson == null)
            .ThenBy(t => t.OwnerPerson!.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (targets, totalCount);
    }

    public async Task<DonationTarget> GetWithOwnerAsync(int id)
    {
        return await _context.Set<DonationTarget>()
            .Include(t => t.OwnerPerson)
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<DonationTarget> GetWithOwnerReadOnlyAsync(int id)
    {
        return await _context.Set<DonationTarget>()
            .AsNoTracking()
            .Include(t => t.OwnerPerson)
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<List<DonationTarget>> GetByYearReadOnlyAsync(int year)
    {
        return await _context.Set<DonationTarget>()
            .AsNoTracking()
            .Include(t => t.OwnerPerson)
            .Where(t => t.Year == year)
            .ToListAsync();
    }
}
