using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Domain.Entities;
using Abacasa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Abacasa.Infrastructure.Repositories;

public class ConsentRecordRepository : RepositoryBase<ConsentRecord, int>, IConsentRecordRepository
{
    public ConsentRecordRepository(ApplicationDbContext context) : base(context) { }

    public async Task<Dictionary<LegalDocumentType, string>> GetLatestVersionsAsync(int userId)
    {
        var records = await _context.Set<ConsentRecord>()
            .AsNoTracking()
            .Where(c => c.UserId == userId)
            .Select(c => new { c.DocumentType, c.Version, c.AcceptedAt, c.Id })
            .ToListAsync();

        return records
            .GroupBy(c => c.DocumentType)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(c => c.AcceptedAt).ThenByDescending(c => c.Id).First().Version);
    }

    public async Task<List<ConsentRecord>> GetByUserReadOnlyAsync(int userId)
    {
        return await _context.Set<ConsentRecord>()
            .AsNoTracking()
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.AcceptedAt)
            .ThenBy(c => c.Id)
            .ToListAsync();
    }
}
