using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.People.Dtos;
using MediatR;

namespace Abacasa.Application.Features.People.Commands.CreatePerson;

public class CreatePersonCommand : IRequest<Result<PersonListDto>>
{
    public string Name { get; set; }
    public string? Relation { get; set; }
}
