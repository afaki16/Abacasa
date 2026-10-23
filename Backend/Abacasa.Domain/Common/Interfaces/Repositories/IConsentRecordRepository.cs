using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Abacasa.Domain.Common.Interfaces.Repositories;

public interface IConsentRecordRepository : IRepository<ConsentRecord, int>
{
    // Kullanıcının belge başına en son onayladığı sürüm
    Task<Dictionary<LegalDocumentType, string>> GetLatestVersionsAsync(int userId);

    // Kullanıcının bütün onayları, en eski önce
    Task<List<ConsentRecord>> GetByUserReadOnlyAsync(int userId);
}
