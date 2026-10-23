using AutoMapper;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.People.Dtos;
using Abacasa.Domain.Common.Interfaces;
using MediatR;
using System.Collections.Generic;

namespace Abacasa.Application.Features.People.Queries.GetAllPeople;

public class GetAllPeopleQueryHandler : IRequestHandler<GetAllPeopleQuery, PagedResult<PersonListDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetAllPeopleQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PagedResult<PersonListDto>> Handle(GetAllPeopleQuery request, CancellationToken cancellationToken)
    {
        var (people, totalCount) = await _unitOfWork.People.GetPeoplePagedAsync(
            request.Page, request.PageSize, request.SearchTerm);

        var dtos = _mapper.Map<IEnumerable<PersonListDto>>(people);
        var totalPages = (int)System.Math.Ceiling(totalCount / (double)request.PageSize);

        return PagedResult<PersonListDto>.Success(dtos, request.Page, totalPages, totalCount);
    }
}
