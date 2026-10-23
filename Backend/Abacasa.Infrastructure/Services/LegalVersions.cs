using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Microsoft.Extensions.Configuration;

namespace Abacasa.Infrastructure.Services;

// appsettings "Legal" bölümü; açılışta okunur (sürüm değişikliği yeniden başlatma ister)
public class LegalVersions : ILegalVersions
{
    public LegalVersions(IConfiguration configuration)
    {
        TermsVersion = configuration["Legal:TermsVersion"] ?? "1.0";
        PrivacyNoticeVersion = configuration["Legal:PrivacyNoticeVersion"] ?? "1.0";
    }

    public string TermsVersion { get; }
    public string PrivacyNoticeVersion { get; }

    public string Current(LegalDocumentType documentType) =>
        documentType == LegalDocumentType.Terms ? TermsVersion : PrivacyNoticeVersion;
}
