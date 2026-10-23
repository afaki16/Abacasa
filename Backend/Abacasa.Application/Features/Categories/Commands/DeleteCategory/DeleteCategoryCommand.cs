using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.Categories.Commands.DeleteCategory;

public class DeleteCategoryCommand : IRequest<Result<bool>>
{
    public int Id { get; set; }
}
