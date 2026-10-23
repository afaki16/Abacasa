using Abacasa.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Abacasa.Domain.Common.Interfaces.Repositories;

public interface IMonthlyAmountRepository : IRepository<MonthlyAmount, int>
{
    // Tracking'li; hücre yazarken güncellemek ya da silmek için (yalnızca canlı kayıt)
    Task<MonthlyAmount?> GetAsync(int ledgerItemId, int year, int month);

    // Yılın tüm canlı hücreleri, tek sorgu
    Task<List<MonthlyAmount>> GetByYearReadOnlyAsync(int year);
}
