using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Domain.Entities;
using Abacasa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Abacasa.Infrastructure.Repositories;

public class PaymentMethodRepository : RepositoryBase<PaymentMethod, int>, IPaymentMethodRepository
{
    public PaymentMethodRepository(ApplicationDbContext context) : base(context) { }

    public async Task<bool> NameExistsAsync(string name, int? excludeId = null)
    {
        var normalizedName = name.Trim().ToLowerInvariant();

        var query = _context.Set<PaymentMethod>()
            .Where(pm => pm.Name.ToLower() == normalizedName);

        if (excludeId.HasValue)
            query = query.Where(pm => pm.Id != excludeId.Value);

        return await query.AnyAsync();
    }

    public async Task<(IEnumerable<PaymentMethod> PaymentMethods, int TotalCount)> GetPaymentMethodsPagedAsync(
        int page, int pageSize, string searchTerm = null, bool? isActive = null)
    {
        var query = _context.Set<PaymentMethod>().AsNoTracking();

        if (isActive.HasValue)
            query = query.Where(pm => pm.IsActive == isActive.Value);

        if (!string.IsNullOrEmpty(searchTerm))
            query = query.Where(pm => pm.Name.ToLower().Contains(searchTerm.ToLowerInvariant()));

        var totalCount = await query.CountAsync();

        var paymentMethods = await query
            .Include(pm => pm.OwnerPerson)
            .OrderBy(pm => pm.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (paymentMethods, totalCount);
    }

    public async Task<PaymentMethod> GetWithOwnerAsync(int id)
    {
        return await _context.Set<PaymentMethod>()
            .Include(pm => pm.OwnerPerson)
            .FirstOrDefaultAsync(pm => pm.Id == id);
    }

    public async Task<PaymentMethod> GetWithOwnerReadOnlyAsync(int id)
    {
        return await _context.Set<PaymentMethod>()
            .AsNoTracking()
            .Include(pm => pm.OwnerPerson)
            .FirstOrDefaultAsync(pm => pm.Id == id);
    }

    public async Task<bool> IsInUseAsync(int paymentMethodId)
    {
        return await _context.Set<Expense>().AnyAsync(e => e.PaymentMethodId == paymentMethodId)
            || await _context.Set<Donation>().AnyAsync(d => d.PaymentMethodId == paymentMethodId)
            || await _context.Set<RecurringPayment>().AnyAsync(rp => rp.PaymentMethodId == paymentMethodId);
    }
}
