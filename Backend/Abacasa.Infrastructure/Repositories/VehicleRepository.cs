using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using Abacasa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Abacasa.Infrastructure.Repositories;

public class VehicleRepository : RepositoryBase<Vehicle, int>, IVehicleRepository
{
    public VehicleRepository(ApplicationDbContext context) : base(context) { }

    public async Task<bool> PlateExistsAsync(string plate, int? excludeId = null)
    {
        // Plaka büyük harfle saklandığı için doğrudan karşılaştırılır
        var query = _context.Set<Vehicle>()
            .Where(v => v.Plate == plate);

        if (excludeId.HasValue)
            query = query.Where(v => v.Id != excludeId.Value);

        return await query.AnyAsync();
    }

    public async Task<(IEnumerable<Vehicle> Vehicles, int TotalCount)> GetVehiclesPagedAsync(int page, int pageSize, VehicleFilter filter)
    {
        var query = _context.Set<Vehicle>().AsNoTracking();

        if (filter.IsActive.HasValue)
            query = query.Where(v => v.IsActive == filter.IsActive.Value);

        // Ad ve plaka içinde arar
        if (!string.IsNullOrEmpty(filter.SearchTerm))
        {
            var term = filter.SearchTerm.ToLowerInvariant();
            query = query.Where(v => v.Name.ToLower().Contains(term) || v.Plate.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync();

        var vehicles = await query
            .Include(v => v.OwnerPerson)
            .OrderBy(v => v.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (vehicles, totalCount);
    }

    public async Task<Vehicle> GetWithOwnerAsync(int id)
    {
        return await _context.Set<Vehicle>()
            .Include(v => v.OwnerPerson)
            .FirstOrDefaultAsync(v => v.Id == id);
    }

    public async Task<Vehicle> GetWithOwnerReadOnlyAsync(int id)
    {
        return await _context.Set<Vehicle>()
            .AsNoTracking()
            .Include(v => v.OwnerPerson)
            .FirstOrDefaultAsync(v => v.Id == id);
    }

    public async Task<bool> HasObligationsAsync(int vehicleId)
    {
        return await _context.Set<VehicleObligation>().AnyAsync(o => o.VehicleId == vehicleId);
    }
}
