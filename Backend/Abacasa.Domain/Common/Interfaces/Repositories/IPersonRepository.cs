using Abacasa.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Abacasa.Domain.Common.Interfaces.Repositories;

public interface IPersonRepository : IRepository<Person, int>
{
    // Tenant filtresi ApplicationDbContext'te uygulanır; burada sadece kullanıcının hanesi görünür.
    Task<bool> NameExistsAsync(string name, int? excludeId = null);

    Task<(IEnumerable<Person> People, int TotalCount)> GetPeoplePagedAsync(
        int page, int pageSize, string searchTerm = null);

    Task<Person> GetByIdReadOnlyAsync(int id);

    Task<bool> IsInUseAsync(int personId);
}
