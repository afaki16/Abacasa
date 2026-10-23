using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Abacasa.Domain.Common.Interfaces.Repositories;

public interface IDonationFundRepository : IRepository<DonationFund, int>
{
    // Tenant filtresi ApplicationDbContext'te uygulanır; burada sadece kullanıcının hanesi görünür.
    Task<(IEnumerable<DonationFund> Funds, int TotalCount)> GetFundsPagedAsync(int page, int pageSize, DonationFundFilter filter);

    Task<DonationFund> GetWithPersonAsync(int id);

    Task<DonationFund> GetWithPersonReadOnlyAsync(int id);

    /// Emanetlerin bağlı canlı bağış ve hareket toplamları (toplu, SQL'de gruplu). Toplamı olmayan emanet de döner.
    /// Değişiklik öncesi kontrol için bir bağış ya da hareket toplamdan hariç tutulabilir.
    Task<Dictionary<int, FundTotals>> GetTotalsAsync(IEnumerable<int> fundIds, int? excludeDonationId = null, int? excludeMovementId = null);

    // Tarihe göre artan
    Task<List<FundMovement>> GetMovementsReadOnlyAsync(int fundId);
}
