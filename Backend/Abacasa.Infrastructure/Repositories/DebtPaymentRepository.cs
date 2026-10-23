using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Domain.Entities;
using Abacasa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Abacasa.Infrastructure.Repositories;

public class DebtPaymentRepository : RepositoryBase<DebtPayment, int>, IDebtPaymentRepository
{
    public DebtPaymentRepository(ApplicationDbContext context) : base(context) { }

    public async Task<List<DebtPayment>> GetByDebtIdReadOnlyAsync(int debtId)
    {
        return await _context.Set<DebtPayment>()
            .AsNoTracking()
            .Where(p => p.DebtId == debtId)
            .OrderBy(p => p.Date)
            .ThenBy(p => p.Id)
            .ToListAsync();
    }
}
