using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Domain.Entities;
using Abacasa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Abacasa.Infrastructure.Repositories;

public class VehicleObligationRepository : RepositoryBase<VehicleObligation, int>, IVehicleObligationRepository
{
    public VehicleObligationRepository(ApplicationDbContext context) : base(context) { }

    public async Task<List<VehicleObligation>> GetByVehicleReadOnlyAsync(int vehicleId)
    {
        return await _context.Set<VehicleObligation>()
            .AsNoTracking()
            .Where(o => o.VehicleId == vehicleId)
            .OrderByDescending(o => o.ValidUntil)
            .ThenByDescending(o => o.Date)
            .ThenByDescending(o => o.Id)
            .ToListAsync();
    }

    public async Task<List<VehicleObligation>> GetByVehiclesReadOnlyAsync(IEnumerable<int> vehicleIds)
    {
        var ids = vehicleIds.ToList();

        return await _context.Set<VehicleObligation>()
            .AsNoTracking()
            .Where(o => ids.Contains(o.VehicleId))
            .ToListAsync();
    }

    public async Task<List<VehicleObligation>> GetForActiveVehiclesReadOnlyAsync()
    {
        return await _context.Set<VehicleObligation>()
            .AsNoTracking()
            .Include(o => o.Vehicle)
            .Where(o => o.Vehicle.IsActive)
            .ToListAsync();
    }

    public async Task<HashSet<int>> GetLiveExpenseIdsAsync(IEnumerable<int> expenseIds)
    {
        var ids = expenseIds.Distinct().ToList();
        if (ids.Count == 0)
            return new HashSet<int>();

        // Harcama filtresi (tenant + soft delete) uygulanır; silinen harcama canlı sayılmaz
        var live = await _context.Set<Expense>()
            .Where(e => ids.Contains(e.Id))
            .Select(e => e.Id)
            .ToListAsync();

        return live.ToHashSet();
    }
}
