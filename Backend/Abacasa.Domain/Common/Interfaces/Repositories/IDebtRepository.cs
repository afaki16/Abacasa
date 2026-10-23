using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Abacasa.Domain.Common.Interfaces.Repositories;

public interface IDebtRepository : IRepository<Debt, int>
{
    // Tenant filtresi ApplicationDbContext'te uygulanır; burada sadece kullanıcının hanesi görünür.
    // Payments include'u da filtrelidir: silinmiş ödemeler gelmez.
    Task<(IEnumerable<Debt> Debts, int TotalCount)> GetDebtsPagedAsync(
        int page, int pageSize, DebtFilter filter);

    Task<Debt> GetWithRelationsAsync(int id);

    Task<Debt> GetWithRelationsReadOnlyAsync(int id);

    // Özet için hanenin tüm borçları ödemeleriyle, tek sorgu
    Task<List<Debt>> GetAllWithPaymentsReadOnlyAsync();
}
