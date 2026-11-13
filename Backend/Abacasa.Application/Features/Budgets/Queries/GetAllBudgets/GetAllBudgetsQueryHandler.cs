using AutoMapper;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Budgets.Dtos;
using Abacasa.Domain.Common.Interfaces;
using MediatR;
using System.Collections.Generic;

namespace Abacasa.Application.Features.Budgets.Queries.GetAllBudgets;

public class GetAllBudgetsQueryHandler : IRequestHandler<GetAllBudgetsQuery, PagedResult<BudgetDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetAllBudgetsQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PagedResult<BudgetDto>> Handle(GetAllBudgetsQuery request, CancellationToken cancellationToken)
    {
        var (budgets, totalCount) = await _unitOfWork.Budgets.GetBudgetsPagedAsync(request.Page, request.PageSize);

        var dtos = _mapper.Map<IEnumerable<BudgetDto>>(budgets);
        var totalPages = (int)System.Math.Ceiling(totalCount / (double)request.PageSize);

        return PagedResult<BudgetDto>.Success(dtos, request.Page, totalPages, totalCount);
    }
}
