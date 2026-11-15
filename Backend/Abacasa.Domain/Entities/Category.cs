using Abacasa.Domain.Common.Interfaces;

namespace Abacasa.Domain.Entities;

public class Category : BaseAuditableEntity, ITenantScoped
{
    public int TenantId { get; set; }
    public string Name { get; set; }

    // Kullanıcının seçtiği ikon anahtarı (CategoryIcons); boşsa istemci addan tahmin eder
    public string? Icon { get; set; }
}
