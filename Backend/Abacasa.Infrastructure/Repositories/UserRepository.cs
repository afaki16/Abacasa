using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Domain.Constants;
using Abacasa.Domain.Entities;
using Abacasa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Abacasa.Infrastructure.Repositories;


public class UserRepository : RepositoryBase<User, int>, IUserRepository
{
    private readonly ApplicationDbContext _context;
    public UserRepository(ApplicationDbContext context) : base(context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    // E-posta tüm sistemde benzersiz (kimlik global)
    public async Task<User> GetByEmailAsync(string email)
    {
        return await _context.Set<User>()
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<User> GetByEmailWithRolesAsync(string email)
    {
        return await _context.Set<User>()
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<User> GetUserWithRolesAsync(int userId)
    {
        return await _context.Set<User>()
            .Include(u => u.Tenant)
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId);
    }
    public async Task<User> GetUserWithRolesReadOnlyAsync(int userId)
    {
        return await _context.Set<User>()
            .AsNoTracking()
            .Include(u => u.Tenant)
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId);
    }

    public async Task<User> GetUserWithPermissionsAsync(int userId)
    {
        return await _context.Set<User>()
            .AsNoTracking()
            .Include(u => u.Tenant)
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .ThenInclude(r => r.RolePermissions)
            .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(u => u.Id == userId);
    }

    public async Task<bool> EmailExistsAsync(string email, int? excludeUserId = null)
    {
        var query = _context.Set<User>().Where(u => u.Email == email);
        if (excludeUserId.HasValue)
            query = query.Where(u => u.Id != excludeUserId.Value);
        return await query.AnyAsync();
    }

    public async Task<bool> PhoneExistsAsync(string phoneNumber, int? excludeUserId = null)
    {
        var query = _context.Set<User>().Where(u => u.PhoneNumber == phoneNumber);
        if (excludeUserId.HasValue)
            query = query.Where(u => u.Id != excludeUserId.Value);
        return await query.AnyAsync();
    }

    public async Task<UserRole> GetUserRoleAsync(int userId, int roleId)
    {
        return await _context.UserRoles
            .FirstOrDefaultAsync(ur => ur.UserId == userId && ur.RoleId == roleId);
    }

    public async Task AddUserRoleAsync(UserRole userRole)
    {
        await _context.UserRoles.AddAsync(userRole);
    }

    public void RemoveUserRole(UserRole userRole)
    {
        _context.UserRoles.Remove(userRole);
    }

    public async Task<(IEnumerable<User> Users, int TotalCount)> GetUsersPagedAsync(int page, int pageSize, string searchTerm = null, int? tenantId = null, bool excludeUsersWithSuperAdminRole = false)
    {
        var baseQuery = BuildUsersQuery(searchTerm, tenantId, excludeUsersWithSuperAdminRole).AsNoTracking();
        var totalCount = await baseQuery.CountAsync();

        var users = await baseQuery
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .OrderBy(u => u.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (users, totalCount);
    }

    private IQueryable<User> BuildUsersQuery(string searchTerm, int? tenantId, bool excludeUsersWithSuperAdminRole)
    {
        var query = _context.Set<User>().AsQueryable();

        if (tenantId.HasValue)
            query = query.Where(u => u.TenantId == tenantId.Value);

        if (excludeUsersWithSuperAdminRole)
            query = query.Where(u => !u.UserRoles.Any(ur => ur.Role.Name == RoleNames.SuperAdmin));

        if (!string.IsNullOrEmpty(searchTerm))
            query = query.Where(u =>
                u.FirstName.ToLower().Contains(searchTerm.ToLowerInvariant()) ||
                u.LastName.ToLower().Contains(searchTerm.ToLowerInvariant()) ||
                u.Email.ToLower().Contains(searchTerm.ToLowerInvariant()));

        return query;
    }

    public async Task<IEnumerable<int>> GetUserIdsByRoleIdAsync(int roleId)
    {
        return await _context.UserRoles
            .Where(ur => ur.RoleId == roleId)
            .Select(ur => ur.UserId)
            .Distinct()
            .ToListAsync();
    }

    public async Task<int> CountActiveSuperAdminsAsync()
    {
        // GlobalQueryFilter on User automatically applies IsDeleted == false,
        // so this count reflects only active SuperAdmins.
        return await _context.Set<User>()
            .Where(u => u.UserRoles.Any(ur => ur.Role.Name == RoleNames.SuperAdmin))
            .CountAsync();
    }

    public async Task<(DateTime? LastSessionsRevokedAt, UserStatus Status, bool TenantOk)?> GetSessionStateAsync(int userId, int? tenantId)
    {
        // Tek sorgu: kullanıcı durumu + token'daki hanede canlı üyelik ve aktif hane.
        // Soft-delete filtresi üyeliğe ve haneye uygulanır; silinmiş üyelik ya da hane TenantOk = false yapar.
        var state = await _context.Set<User>()
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new
            {
                u.LastSessionsRevokedAt,
                u.Status,
                TenantOk = tenantId == null ||
                    (_context.Set<TenantMembership>().Any(m => m.UserId == u.Id && m.TenantId == tenantId) &&
                     _context.Set<Tenant>().Any(t => t.Id == tenantId && t.IsActive))
            })
            .FirstOrDefaultAsync();

        if (state == null)
            return null;

        return (state.LastSessionsRevokedAt, state.Status, state.TenantOk);
    }

    public async Task<bool> TenantHasSuperAdminAsync(int tenantId)
    {
        return await _context.Set<User>()
            .AnyAsync(u => u.TenantId == tenantId && u.UserRoles.Any(ur => ur.Role.Name == RoleNames.SuperAdmin));
    }

    public async Task<int> CountByTenantIdAsync(int tenantId)
    {
        return await _context.Set<User>()
            .CountAsync(u => u.TenantId == tenantId);
    }
}
