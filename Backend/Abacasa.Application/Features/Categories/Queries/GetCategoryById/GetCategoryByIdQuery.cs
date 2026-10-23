using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Categories.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Categories.Queries.GetCategoryById;

public class GetCategoryByIdQuery : IRequest<Result<CategoryDto>>
{
    public int Id { get; set; }
}
