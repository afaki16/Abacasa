using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Abacasa.Domain.Common.Interfaces.Repositories;

public interface IRecurringPaymentRepository : IRepository<RecurringPayment, int>
{
    // Tenant filtresi ApplicationDbContext'te uygulanır; burada sadece kullanıcının hanesi görünür.
    Task<bool> NameExistsAsync(string name, int? excludeId = null);

    Task<(IEnumerable<RecurringPayment> RecurringPayments, int TotalCount)> GetRecurringPaymentsPagedAsync(
        int page, int pageSize, RecurringPaymentFilter filter);

    Task<RecurringPayment> GetWithRelationsAsync(int id);

    Task<RecurringPayment> GetWithRelationsReadOnlyAsync(int id);

    // Vade hesabı için hanenin tüm planları (pasifler dahil), tek sorgu
    Task<List<RecurringPayment>> GetAllWithRelationsReadOnlyAsync();

    // Plana bağlı canlı harcama/bağış var mı
    Task<bool> HasPaymentsAsync(int recurringPaymentId);

    // Verilen planlardan ödemesi olanlar (liste için toplu)
    Task<HashSet<int>> GetIdsWithPaymentsAsync(IEnumerable<int> recurringPaymentIds);

    Task<bool> IsMonthPaidAsync(int recurringPaymentId, DateOnly month);

    // fromMonth ≤ Month ≤ toMonth aralığındaki bağlı canlı kayıtlar (harcama + bağış)
    Task<List<RecurringPaymentRecord>> GetPaymentRecordsAsync(DateOnly fromMonth, DateOnly toMonth);

    // Her planın en son ayına ait ödenen tutar (tahmini tutar için)
    Task<Dictionary<int, decimal>> GetLastPaidAmountsAsync();
}
