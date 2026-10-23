using AutoMapper;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Debts.Common;
using Abacasa.Application.Features.Debts.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;
using System.Collections.Generic;
using System.Linq;

namespace Abacasa.Application.Features.Debts.Queries.GetAllDebts;

public class GetAllDebtsQueryHandler : IRequestHandler<GetAllDebtsQuery, PagedResult<DebtListDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetAllDebtsQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PagedResult<DebtListDto>> Handle(GetAllDebtsQuery request, CancellationToken cancellationToken)
    {
        var filter = new DebtFilter
        {
            IsClosed = request.IsClosed,
            CreditorPersonId = request.CreditorPersonId,
            Currency = request.Currency,
            SearchTerm = request.SearchTerm
        };

        var (debts, totalCount) = await _unitOfWork.Debts.GetDebtsPagedAsync(
            request.Page, request.PageSize, filter);

        // Ödenen/kalan alanları sayfadaki borçların canlı ödemelerinden hesaplanır
        var usdRate = await _unitOfWork.ExchangeRates.GetLatestAsync(Currency.USD);
        var dtos = new List<DebtListDto>();
        foreach (var debt in debts)
        {
            var dto = _mapper.Map<DebtListDto>(debt);
            DebtAmounts.Fill(dto, debt, usdRate?.Rate);
            dtos.Add(dto);
        }

        var totalPages = (int)System.Math.Ceiling(totalCount / (double)request.PageSize);

        return PagedResult<DebtListDto>.Success(dtos, request.Page, totalPages, totalCount);
    }
}
