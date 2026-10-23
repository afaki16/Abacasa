using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.People.Dtos;
using MediatR;

namespace Abacasa.Application.Features.People.Commands.UpdatePerson;

public class UpdatePersonCommand : IRequest<Result<PersonListDto>>
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string? Relation { get; set; }
}
