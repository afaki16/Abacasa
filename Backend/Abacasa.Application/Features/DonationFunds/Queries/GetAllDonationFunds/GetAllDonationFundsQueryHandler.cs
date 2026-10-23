using AutoMapper;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.DonationFunds.Common;
using Abacasa.Application.Features.DonationFunds.Dtos;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;
using System.Collections.Generic;
using System.Linq;

namespace Abacasa.Application.Features.DonationFunds.Queries.GetAllDonationFunds;

public class GetAllDonationFundsQueryHandler : IRequestHandler<GetAllDonationFundsQuery, PagedResult<DonationFundDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetAllDonationFundsQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PagedResult<DonationFundDto>> Handle(GetAllDonationFundsQuery request, CancellationToken cancellationToken)
    {
        var filter = new DonationFundFilter
        {
            IsClosed = request.IsClosed,
            SearchTerm = request.SearchTerm
        };

        var (funds, totalCount) = await _unitOfWork.DonationFunds.GetFundsPagedAsync(request.Page, request.PageSize, filter);
        var fundList = funds.ToList();

        // Dağıtılan, kullanımda, kalan ve elde sayfadaki emanetler için tek seferde hesaplanır
        var totals = await _unitOfWork.DonationFunds.GetTotalsAsync(fundList.Select(f => f.Id));
        var dtos = new List<DonationFundDto>();
        foreach (var fund in fundList)
        {
            var dto = _mapper.Map<DonationFundDto>(fund);
            FundBalance.Fill(dto, fund, totals[fund.Id]);
            dtos.Add(dto);
        }

        var totalPages = (int)System.Math.Ceiling(totalCount / (double)request.PageSize);

        return PagedResult<DonationFundDto>.Success(dtos, request.Page, totalPages, totalCount);
    }
}
