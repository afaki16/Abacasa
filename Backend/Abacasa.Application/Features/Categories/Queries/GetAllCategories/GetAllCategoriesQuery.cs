using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Categories.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Categories.Queries.GetAllCategories;

public class GetAllCategoriesQuery : IRequest<PagedResult<CategoryListDto>>
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string SearchTerm { get; set; }
}
