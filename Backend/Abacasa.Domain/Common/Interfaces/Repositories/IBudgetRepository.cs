using Abacasa.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Abacasa.Domain.Common.Interfaces.Repositories;

public interface IBudgetRepository : IRepository<Budget, int>
{
    // Tenant filtresi ApplicationDbContext'te uygulanır; burada sadece kullanıcının hanesi görünür.
    // Aynı (kişi, başlangıç ayı) kontrolü; kişi boşken (hane) de çalışır
    Task<bool> ExistsAsync(int? ownerPersonId, int startYear, int startMonth, int? excludeId = null);

    Task<(IEnumerable<Budget> Budgets, int TotalCount)> GetBudgetsPagedAsync(int page, int pageSize);

    Task<Budget> GetWithOwnerAsync(int id);

    Task<Budget> GetWithOwnerReadOnlyAsync(int id);

    // Verilen aya kadar (dahil) başlamış bütün kayıtlar, tek sorgu; ayın geçerli bütçeleri bunlardan seçilir
    Task<List<Budget>> GetStartedByReadOnlyAsync(int year, int month);
}
