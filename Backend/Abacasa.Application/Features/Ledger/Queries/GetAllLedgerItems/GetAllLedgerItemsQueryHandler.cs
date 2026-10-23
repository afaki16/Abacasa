using AutoMapper;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Ledger.Dtos;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;
using System.Collections.Generic;
using System.Linq;

namespace Abacasa.Application.Features.Ledger.Queries.GetAllLedgerItems;

public class GetAllLedgerItemsQueryHandler : IRequestHandler<GetAllLedgerItemsQuery, PagedResult<LedgerItemListDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetAllLedgerItemsQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PagedResult<LedgerItemListDto>> Handle(GetAllLedgerItemsQuery request, CancellationToken cancellationToken)
    {
        var filter = new LedgerItemFilter
        {
            Direction = request.Direction,
            IsActive = request.IsActive,
            SearchTerm = request.SearchTerm
        };

        var (items, totalCount) = await _unitOfWork.LedgerItems.GetLedgerItemsPagedAsync(
            request.Page, request.PageSize, filter);

        var dtos = _mapper.Map<List<LedgerItemListDto>>(items);

        // hasAmounts sayfadaki kalemler için tek seferde hesaplanır
        var idsWithAmounts = await _unitOfWork.LedgerItems.GetIdsWithAmountsAsync(dtos.Select(d => d.Id));
        foreach (var dto in dtos)
            dto.HasAmounts = idsWithAmounts.Contains(dto.Id);

        var totalPages = (int)System.Math.Ceiling(totalCount / (double)request.PageSize);

        return PagedResult<LedgerItemListDto>.Success(dtos, request.Page, totalPages, totalCount);
    }
}
