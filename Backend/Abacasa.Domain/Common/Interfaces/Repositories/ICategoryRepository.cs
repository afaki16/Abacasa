using Abacasa.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Abacasa.Domain.Common.Interfaces.Repositories;

public interface ICategoryRepository : IRepository<Category, int>
{
    // Tenant filtresi ApplicationDbContext'te uygulanır; burada sadece kullanıcının hanesi görünür.
    Task<bool> NameExistsAsync(string name, int? excludeId = null);

    Task<(IEnumerable<Category> Categories, int TotalCount)> GetCategoriesPagedAsync(
        int page, int pageSize, string searchTerm = null);

    Task<Category> GetByIdReadOnlyAsync(int id);

    Task<bool> IsInUseAsync(int categoryId);
}
