using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.People.Commands.DeletePerson;

public class DeletePersonCommand : IRequest<Result<bool>>
{
    public int Id { get; set; }
}
