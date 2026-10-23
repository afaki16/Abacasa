namespace Abacasa.Domain.Common.Interfaces;

/// Hane (tenant) verisi. ApplicationDbContext bu entity'lere tenant filtresi uygular ve yeni kayda TenantId atar.
public interface ITenantScoped
{
    int TenantId { get; set; }
}
