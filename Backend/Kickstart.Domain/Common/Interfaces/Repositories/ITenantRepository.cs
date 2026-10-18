using Kickstart.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Kickstart.Domain.Common.Interfaces.Repositories;

public interface ITenantRepository : IRepository<Tenant, int>
{
    Task<Tenant> GetByNameAsync(string name);
    Task<Tenant> GetByDomainAsync(string domain);
    Task<bool> NameExistsAsync(string name);
    Task<bool> DomainExistsAsync(string domain);
}

