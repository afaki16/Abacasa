using Abacasa.Domain.Common.Enums;
using System;

namespace Abacasa.Domain.Entities;

// Kullanım koşulları / aydınlatma metni onay kaydı. Kullanıcıya bağlıdır, hane verisi değildir (ITenantScoped değil).
// Veri en azında tutulur: IP ya da tarayıcı bilgisi saklanmaz.
// Hesap silmede silinmez: kullanıcı anonimleştiği için bu kayıtlar kişisel veri taşımaz (onayın varlığının kanıtı olarak kalır).
public class ConsentRecord : BaseEntity
{
    public int UserId { get; set; }
    public User User { get; set; }

    public LegalDocumentType DocumentType { get; set; }

    // Onaylanan metnin sürümü (appsettings Legal)
    public string Version { get; set; }

    public DateTime AcceptedAt { get; set; }
}
