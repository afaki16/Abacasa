using AutoMapper;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Categories.Dtos;
using Abacasa.Domain.Common.Interfaces;
using MediatR;
using System.Collections.Generic;
using System.Linq;

namespace Abacasa.Application.Features.Categories.Queries.GetAllCategories;

public class GetAllCategoriesQueryHandler : IRequestHandler<GetAllCategoriesQuery, PagedResult<CategoryListDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetAllCategoriesQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PagedResult<CategoryListDto>> Handle(GetAllCategoriesQuery request, CancellationToken cancellationToken)
    {
        var (categories, totalCount) = await _unitOfWork.Categories.GetCategoriesPagedAsync(
            request.Page, request.PageSize, request.SearchTerm);

        var dtos = _mapper.Map<List<CategoryListDto>>(categories);

        var usage = await _unitOfWork.Categories.GetUsageCountsAsync(dtos.Select(d => d.Id));
        foreach (var dto in dtos)
            dto.UsageCount = usage.GetValueOrDefault(dto.Id);
        var totalPages = (int)System.Math.Ceiling(totalCount / (double)request.PageSize);

        return PagedResult<CategoryListDto>.Success(dtos, request.Page, totalPages, totalCount);
    }
}
