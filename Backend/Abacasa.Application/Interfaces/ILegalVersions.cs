using Abacasa.Domain.Common.Enums;

namespace Abacasa.Application.Interfaces;

// Kullanım koşulları ve aydınlatma metninin güncel sürümleri (appsettings Legal).
// Metin değişince sürüm artırılır; kullanıcılar bir sonraki girişte yeniden onaylar.
public interface ILegalVersions
{
    string TermsVersion { get; }
    string PrivacyNoticeVersion { get; }

    string Current(LegalDocumentType documentType);
}
