using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Abacasa.Domain.Common.Interfaces.Repositories;

public interface IDonationTargetRepository : IRepository<DonationTarget, int>
{
    // Tenant filtresi ApplicationDbContext'te uygulanır; burada sadece kullanıcının hanesi görünür.
    // Aynı (kişi, yıl, tür) kontrolü; kişi boşken (hane) de çalışır (NULL'lar uygulamada eşit sayılır)
    Task<bool> ExistsAsync(int? ownerPersonId, int year, DonationKind kind, int? excludeId = null);

    Task<(IEnumerable<DonationTarget> Targets, int TotalCount)> GetTargetsPagedAsync(int page, int pageSize, int? year);

    Task<DonationTarget> GetWithOwnerAsync(int id);

    Task<DonationTarget> GetWithOwnerReadOnlyAsync(int id);

    // Hedef raporu için yılın tüm hedefleri, tek sorgu
    Task<List<DonationTarget>> GetByYearReadOnlyAsync(int year);
}
