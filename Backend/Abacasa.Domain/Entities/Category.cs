using Abacasa.Domain.Common.Interfaces;

namespace Abacasa.Domain.Entities;

public class Category : BaseAuditableEntity, ITenantScoped
{
    public int TenantId { get; set; }
    public string Name { get; set; }
}
