using Abacasa.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Abacasa.Domain.Common.Interfaces.Repositories;

public interface IVehicleObligationRepository : IRepository<VehicleObligation, int>
{
    // Aracın işlemleri; geçerlilik sonuna göre azalan
    Task<List<VehicleObligation>> GetByVehicleReadOnlyAsync(int vehicleId);

    // Verilen araçların işlemleri (liste DTO'sundaki güncel kayıtlar için, tek sorgu)
    Task<List<VehicleObligation>> GetByVehiclesReadOnlyAsync(IEnumerable<int> vehicleIds);

    // Aktif araçların işlemleri araçlarıyla (hatırlatmalar için, tek sorgu)
    Task<List<VehicleObligation>> GetForActiveVehiclesReadOnlyAsync();

    // Verilen harcamalardan canlı olanlar (hasExpense için, toplu)
    Task<HashSet<int>> GetLiveExpenseIdsAsync(IEnumerable<int> expenseIds);
}
