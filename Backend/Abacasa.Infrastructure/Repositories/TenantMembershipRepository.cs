using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Domain.Entities;
using Abacasa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Abacasa.Infrastructure.Repositories;

public class TenantMembershipRepository : RepositoryBase<TenantMembership, int>, ITenantMembershipRepository
{
    public TenantMembershipRepository(ApplicationDbContext context) : base(context) { }

    public async Task<List<TenantMembership>> GetByUserReadOnlyAsync(int userId)
    {
        // Soft-delete filtresi üyeliğe ve haneye uygulanır; silinmiş hanenin üyeliği dönmez
        return await _context.Set<TenantMembership>()
            .AsNoTracking()
            .Include(m => m.Tenant)
            .Where(m => m.UserId == userId && _context.Set<Tenant>().Any(t => t.Id == m.TenantId))
            .OrderBy(m => m.CreatedDate)
            .ThenBy(m => m.Id)
            .ToListAsync();
    }

    public async Task<TenantMembership?> GetActiveAsync(int userId, int tenantId)
    {
        return await _context.Set<TenantMembership>()
            .Include(m => m.Tenant)
            .FirstOrDefaultAsync(m => m.UserId == userId && m.TenantId == tenantId);
    }

    public async Task<int> CountAdminMembershipsAsync(int userId)
    {
        return await _context.Set<TenantMembership>()
            .CountAsync(m => m.UserId == userId && m.Role == HouseholdRole.Admin);
    }

    // Üyelik ITenantScoped değil; hane ile sorgulanır. Kişi navigasyonu hane filtresinden geçer (aktif hane)
    public async Task<List<TenantMembership>> GetByTenantReadOnlyAsync(int tenantId)
    {
        return await _context.Set<TenantMembership>()
            .AsNoTracking()
            .Include(m => m.User)
            .Include(m => m.Person)
            .Where(m => m.TenantId == tenantId)
            .OrderBy(m => m.CreatedDate)
            .ThenBy(m => m.Id)
            .ToListAsync();
    }

    public async Task<TenantMembership?> GetInTenantAsync(int membershipId, int tenantId)
    {
        return await _context.Set<TenantMembership>()
            .Include(m => m.User)
            .Include(m => m.Person)
            .FirstOrDefaultAsync(m => m.Id == membershipId && m.TenantId == tenantId);
    }

    public async Task<int> CountByTenantAsync(int tenantId)
    {
        return await _context.Set<TenantMembership>().CountAsync(m => m.TenantId == tenantId);
    }

    public async Task<int> CountAdminsByTenantAsync(int tenantId)
    {
        return await _context.Set<TenantMembership>()
            .CountAsync(m => m.TenantId == tenantId && m.Role == HouseholdRole.Admin);
    }

    public async Task<bool> IsPersonLinkedAsync(int personId, int? excludeMembershipId = null)
    {
        return await _context.Set<TenantMembership>()
            .AnyAsync(m => m.PersonId == personId && (excludeMembershipId == null || m.Id != excludeMembershipId));
    }

    public async Task<bool> IsEmailMemberAsync(string email, int tenantId)
    {
        return await _context.Set<TenantMembership>()
            .AnyAsync(m => m.TenantId == tenantId && m.User.Email == email);
    }
}
