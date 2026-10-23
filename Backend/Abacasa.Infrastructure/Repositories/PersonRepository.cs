using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Domain.Entities;
using Abacasa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Abacasa.Infrastructure.Repositories;

public class PersonRepository : RepositoryBase<Person, int>, IPersonRepository
{
    public PersonRepository(ApplicationDbContext context) : base(context) { }

    public async Task<bool> NameExistsAsync(string name, int? excludeId = null)
    {
        var normalizedName = name.Trim().ToLowerInvariant();

        var query = _context.Set<Person>()
            .Where(p => p.Name.ToLower() == normalizedName);

        if (excludeId.HasValue)
            query = query.Where(p => p.Id != excludeId.Value);

        return await query.AnyAsync();
    }

    public async Task<(IEnumerable<Person> People, int TotalCount)> GetPeoplePagedAsync(
        int page, int pageSize, string searchTerm = null)
    {
        var query = _context.Set<Person>().AsNoTracking();

        if (!string.IsNullOrEmpty(searchTerm))
            query = query.Where(p => p.Name.ToLower().Contains(searchTerm.ToLowerInvariant()));

        var totalCount = await query.CountAsync();

        var people = await query
            .OrderBy(p => p.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (people, totalCount);
    }

    public async Task<Person> GetByIdReadOnlyAsync(int id)
    {
        return await _context.Set<Person>()
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<bool> IsInUseAsync(int personId)
    {
        return await _context.Set<PaymentMethod>().AnyAsync(pm => pm.OwnerPersonId == personId)
            || await _context.Set<Expense>().AnyAsync(e => e.OwnerPersonId == personId)
            || await _context.Set<Donation>().AnyAsync(d => d.GiverPersonId == personId)
            || await _context.Set<RecurringPayment>().AnyAsync(rp => rp.OwnerPersonId == personId)
            || await _context.Set<Debt>().AnyAsync(d => d.CreditorPersonId == personId || d.DebtorPersonId == personId)
            || await _context.Set<LedgerItem>().AnyAsync(li => li.OwnerPersonId == personId)
            || await _context.Set<DonationTarget>().AnyAsync(t => t.OwnerPersonId == personId)
            || await _context.Set<DonationFund>().AnyAsync(f => f.FromPersonId == personId)
            || await _context.Set<Vehicle>().AnyAsync(v => v.OwnerPersonId == personId);
    }
}
