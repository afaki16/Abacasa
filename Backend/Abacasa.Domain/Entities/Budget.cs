using Abacasa.Domain.Common.Interfaces;

namespace Abacasa.Domain.Entities;

// Aylık harcama bütçesi: kişi (boşsa hane) için başlangıç ayından itibaren, aynı kişinin daha yeni kaydına kadar geçerli.
// CategoryId doluysa kategori bütçesidir: hane geneli (kişi boş), aynı kategorinin daha yeni kaydına kadar geçerli;
// kişi bütçelerini ve Ortak satırını etkilemez.
// Tutar 0 ise o aydan itibaren bütçe yoktur. Kullanılan ve kalan saklanmaz; kayıtlardan hesaplanır.
public class Budget : BaseAuditableEntity, ITenantScoped
{
    public int TenantId { get; set; }

    // Boşsa hane
    public int? OwnerPersonId { get; set; }
    public Person? OwnerPerson { get; set; }

    // Boşsa genel (hane ya da kişi) bütçe
    public int? CategoryId { get; set; }
    public Category? Category { get; set; }

    public int StartYear { get; set; }

    // 1–12
    public int StartMonth { get; set; }

    public decimal Amount { get; set; }
    public string? Note { get; set; }
}
