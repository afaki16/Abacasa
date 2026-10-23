using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Categories.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Categories.Commands.UpdateCategory;

public class UpdateCategoryCommand : IRequest<Result<CategoryListDto>>
{
    public int Id { get; set; }
    public string Name { get; set; }
}
