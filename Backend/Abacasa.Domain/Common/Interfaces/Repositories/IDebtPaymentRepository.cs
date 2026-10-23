using Abacasa.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Abacasa.Domain.Common.Interfaces.Repositories;

public interface IDebtPaymentRepository : IRepository<DebtPayment, int>
{
    // Tarihe göre artan
    Task<List<DebtPayment>> GetByDebtIdReadOnlyAsync(int debtId);
}
