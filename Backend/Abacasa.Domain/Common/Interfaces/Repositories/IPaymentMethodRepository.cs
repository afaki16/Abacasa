using Abacasa.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Abacasa.Domain.Common.Interfaces.Repositories;

public interface IPaymentMethodRepository : IRepository<PaymentMethod, int>
{
    // Tenant filtresi ApplicationDbContext'te uygulanır; burada sadece kullanıcının hanesi görünür.
    Task<bool> NameExistsAsync(string name, int? excludeId = null);

    Task<(IEnumerable<PaymentMethod> PaymentMethods, int TotalCount)> GetPaymentMethodsPagedAsync(
        int page, int pageSize, string searchTerm = null, bool? isActive = null);

    Task<PaymentMethod> GetWithOwnerAsync(int id);

    Task<PaymentMethod> GetWithOwnerReadOnlyAsync(int id);

    Task<bool> IsInUseAsync(int paymentMethodId);
}
