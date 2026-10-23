using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Domain.Entities;
using Abacasa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Abacasa.Infrastructure.Repositories;

public class HouseholdInvitationRepository : RepositoryBase<HouseholdInvitation, int>, IHouseholdInvitationRepository
{
    public HouseholdInvitationRepository(ApplicationDbContext context) : base(context) { }

    public async Task<List<HouseholdInvitation>> GetListReadOnlyAsync()
    {
        return await _context.Set<HouseholdInvitation>()
            .AsNoTracking()
            .Include(i => i.Person)
            .ToListAsync();
    }

    public async Task<HouseholdInvitation?> GetWithPersonAsync(int id)
    {
        return await _context.Set<HouseholdInvitation>()
            .Include(i => i.Person)
            .FirstOrDefaultAsync(i => i.Id == id);
    }

    public async Task<HouseholdInvitation?> GetByTokenHashAsync(string tokenHash)
    {
        // Token sahibi henüz o hanede değildir: hane filtresi kapatılır, soft-delete elle uygulanır
        return await _context.Set<HouseholdInvitation>()
            .IgnoreQueryFilters()
            .Include(i => i.InvitedByUser)
            .FirstOrDefaultAsync(i => i.TokenHash == tokenHash && !i.IsDeleted);
    }

    public async Task<bool> HasPendingForEmailAsync(string email, DateTime utcNow)
    {
        return await _context.Set<HouseholdInvitation>()
            .AnyAsync(i => i.Email == email && i.AcceptedAt == null && i.RevokedAt == null && i.ExpiresAt > utcNow);
    }

    public async Task<bool> IsPersonInPendingInvitationAsync(int personId, DateTime utcNow, int? excludeInvitationId = null)
    {
        return await _context.Set<HouseholdInvitation>()
            .AnyAsync(i => i.PersonId == personId
                && i.AcceptedAt == null && i.RevokedAt == null && i.ExpiresAt > utcNow
                && (excludeInvitationId == null || i.Id != excludeInvitationId));
    }
}
