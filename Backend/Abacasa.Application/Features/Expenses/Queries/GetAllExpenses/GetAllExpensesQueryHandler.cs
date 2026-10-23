using AutoMapper;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Expenses.Dtos;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;
using System.Collections.Generic;

namespace Abacasa.Application.Features.Expenses.Queries.GetAllExpenses;

public class GetAllExpensesQueryHandler : IRequestHandler<GetAllExpensesQuery, PagedResult<ExpenseListDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetAllExpensesQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PagedResult<ExpenseListDto>> Handle(GetAllExpensesQuery request, CancellationToken cancellationToken)
    {
        var filter = new ExpenseFilter
        {
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            CategoryId = request.CategoryId,
            PaymentMethodId = request.PaymentMethodId,
            OwnerPersonId = request.OwnerPersonId,
            SearchTerm = request.SearchTerm
        };

        var (expenses, totalCount) = await _unitOfWork.Expenses.GetExpensesPagedAsync(
            request.Page, request.PageSize, filter);

        var dtos = _mapper.Map<IEnumerable<ExpenseListDto>>(expenses);
        var totalPages = (int)System.Math.Ceiling(totalCount / (double)request.PageSize);

        return PagedResult<ExpenseListDto>.Success(dtos, request.Page, totalPages, totalCount);
    }
}
