using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Abacasa.Domain.Common.Interfaces.Repositories;

public interface ILedgerItemRepository : IRepository<LedgerItem, int>
{
    // Tenant filtresi ApplicationDbContext'te uygulanır; burada sadece kullanıcının hanesi görünür.
    Task<bool> NameExistsAsync(string name, int? excludeId = null);

    Task<(IEnumerable<LedgerItem> LedgerItems, int TotalCount)> GetLedgerItemsPagedAsync(
        int page, int pageSize, LedgerItemFilter filter);

    Task<LedgerItem> GetWithOwnerAsync(int id);

    Task<LedgerItem> GetWithOwnerReadOnlyAsync(int id);

    // Yıllık tablo için hanenin tüm kalemleri (pasifler dahil), tek sorgu
    Task<List<LedgerItem>> GetAllWithOwnerReadOnlyAsync();

    // Kalemin canlı tutarı var mı (herhangi bir yıl)
    Task<bool> HasAmountsAsync(int ledgerItemId);

    // Verilen kalemlerden tutarı olanlar (liste için toplu)
    Task<HashSet<int>> GetIdsWithAmountsAsync(IEnumerable<int> ledgerItemIds);
}
