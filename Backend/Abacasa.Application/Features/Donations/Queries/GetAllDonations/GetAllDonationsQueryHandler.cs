using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Features.DonationFunds.Common;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Donations.Dtos;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;
using System.Collections.Generic;
using System.Linq;

namespace Abacasa.Application.Features.Donations.Queries.GetAllDonations;

public class GetAllDonationsQueryHandler : IRequestHandler<GetAllDonationsQuery, PagedResult<DonationListDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public GetAllDonationsQueryHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<PagedResult<DonationListDto>> Handle(GetAllDonationsQuery request, CancellationToken cancellationToken)
    {
        var filter = new DonationFilter
        {
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Kind = request.Kind,
            SearchTerm = request.SearchTerm,
            FundId = request.FundId
        };

        var (donations, totalCount) = await _unitOfWork.Donations.GetDonationsPagedAsync(
            request.Page, request.PageSize, filter);

        var donationList = donations.ToList();
        var dtos = _mapper.Map<List<DonationListDto>>(donationList);

        // Emanet etiketi "Kimden · Tür"; emanet ve veren kişi sorguda yüklendi
        for (var i = 0; i < dtos.Count; i++)
            dtos[i].FundLabel = donationList[i].Fund == null ? null : FundBalance.Label(donationList[i].Fund!, _localizer);
        var totalPages = (int)System.Math.Ceiling(totalCount / (double)request.PageSize);

        return PagedResult<DonationListDto>.Success(dtos, request.Page, totalPages, totalCount);
    }
}
