using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.People.Dtos;
using MediatR;

namespace Abacasa.Application.Features.People.Queries.GetPersonById;

public class GetPersonByIdQuery : IRequest<Result<PersonDto>>
{
    public int Id { get; set; }
}
