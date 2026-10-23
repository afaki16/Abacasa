using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.People.Dtos;
using MediatR;

namespace Abacasa.Application.Features.People.Queries.GetAllPeople;

public class GetAllPeopleQuery : IRequest<PagedResult<PersonListDto>>
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string SearchTerm { get; set; }
}
