using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;

namespace Abacasa.Application.Features.Auth.Common;

// Onay kayıtlarının ortak parçaları: bekleyen belgeler ve güncel sürümle onay yazma
public static class LegalConsents
{
    public static readonly LegalDocumentType[] AllDocuments = { LegalDocumentType.Terms, LegalDocumentType.PrivacyNotice };

    // En son onaylanan sürüm güncel sürümden farklıysa ya da hiç kayıt yoksa belge bekleyen listesine girer
    public static async Task<List<string>> GetPendingAsync(IUnitOfWork unitOfWork, ILegalVersions legalVersions, int userId)
    {
        var latest = await unitOfWork.ConsentRecords.GetLatestVersionsAsync(userId);
        return AllDocuments
            .Where(d => !latest.TryGetValue(d, out var version) || version != legalVersions.Current(d))
            .Select(d => d.ToString())
            .ToList();
    }

    // Güncel sürümlerle onay kayıtları ekler (kaydetme çağırana aittir)
    public static async Task AddAsync(IUnitOfWork unitOfWork, ILegalVersions legalVersions, int userId, IEnumerable<LegalDocumentType> documents)
    {
        var now = DateTime.UtcNow;
        foreach (var document in documents.Distinct())
            await unitOfWork.ConsentRecords.AddAsync(new ConsentRecord
            {
                UserId = userId,
                DocumentType = document,
                Version = legalVersions.Current(document),
                AcceptedAt = now
            });
    }
}
