using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Abacasa.Domain.Common.Interfaces.Repositories;

public interface IVehicleRepository : IRepository<Vehicle, int>
{
    // Tenant filtresi ApplicationDbContext'te uygulanır; burada sadece kullanıcının hanesi görünür.
    // plate normalize edilmiş (Trim + büyük harf) olarak verilir
    Task<bool> PlateExistsAsync(string plate, int? excludeId = null);

    Task<(IEnumerable<Vehicle> Vehicles, int TotalCount)> GetVehiclesPagedAsync(int page, int pageSize, VehicleFilter filter);

    Task<Vehicle> GetWithOwnerAsync(int id);

    Task<Vehicle> GetWithOwnerReadOnlyAsync(int id);

    Task<bool> HasObligationsAsync(int vehicleId);
}
