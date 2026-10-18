using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Domain.Entities;
using Abacasa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Abacasa.Infrastructure.Repositories
{
    public class TenantRepository : RepositoryBase<Tenant, int>, ITenantRepository
{
    private readonly ApplicationDbContext _context;

    public TenantRepository(ApplicationDbContext context) : base(context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<Tenant> GetByNameAsync(string name)
    {
        return await _context.Set<Tenant>()
            .FirstOrDefaultAsync(t => t.Name == name);
    }

    public async Task<Tenant> GetByDomainAsync(string domain)
    {
        if (string.IsNullOrWhiteSpace(domain)) return null;
        var domainLower = domain.Trim().ToLower();
        return await _context.Set<Tenant>()
            .FirstOrDefaultAsync(t => t.Domain != null && t.Domain.ToLower() == domainLower);
    }

        public async Task<bool> NameExistsAsync(string name)
    {
        return await _context.Set<Tenant>()
            .AnyAsync(t => t.Name == name);
    }

    public async Task<bool> DomainExistsAsync(string domain)
    {
        return await _context.Set<Tenant>()
            .AnyAsync(t => t.Domain == domain);
    }
}
}