using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Categories.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Categories.Commands.CreateCategory;

public class CreateCategoryCommand : IRequest<Result<CategoryListDto>>
{
    public string Name { get; set; }
}
