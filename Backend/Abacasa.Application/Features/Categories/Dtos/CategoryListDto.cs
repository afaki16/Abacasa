using System;

namespace Abacasa.Application.Features.Categories.Dtos;

public class CategoryListDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public DateTime CreatedDate { get; set; }

    /// Bu kategoriye bağlı harcama ve sabit ödeme sayısı (saklanmaz, hesaplanır). Yalnızca listede dolar.
    public int UsageCount { get; set; }
}
