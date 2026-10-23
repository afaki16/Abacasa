using Abacasa.Domain.Common.Interfaces;

namespace Abacasa.Domain.Entities;

public class Person : BaseAuditableEntity, ITenantScoped
{
    public int TenantId { get; set; }
    public string Name { get; set; }
    public string? Relation { get; set; }
}
