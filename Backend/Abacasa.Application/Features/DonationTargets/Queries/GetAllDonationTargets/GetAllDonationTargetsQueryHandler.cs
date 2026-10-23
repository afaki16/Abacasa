using AutoMapper;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.DonationTargets.Dtos;
using Abacasa.Domain.Common.Interfaces;
using MediatR;
using System.Collections.Generic;

namespace Abacasa.Application.Features.DonationTargets.Queries.GetAllDonationTargets;

public class GetAllDonationTargetsQueryHandler : IRequestHandler<GetAllDonationTargetsQuery, PagedResult<DonationTargetDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetAllDonationTargetsQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PagedResult<DonationTargetDto>> Handle(GetAllDonationTargetsQuery request, CancellationToken cancellationToken)
    {
        var (targets, totalCount) = await _unitOfWork.DonationTargets.GetTargetsPagedAsync(request.Page, request.PageSize, request.Year);

        var dtos = _mapper.Map<IEnumerable<DonationTargetDto>>(targets);
        var totalPages = (int)System.Math.Ceiling(totalCount / (double)request.PageSize);

        return PagedResult<DonationTargetDto>.Success(dtos, request.Page, totalPages, totalCount);
    }
}
