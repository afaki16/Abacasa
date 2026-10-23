using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Expenses.Dtos;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;
using System.Linq;

namespace Abacasa.Application.Features.Expenses.Queries.GetExpenseSummary;

public class GetExpenseSummaryQueryHandler : IRequestHandler<GetExpenseSummaryQuery, Result<ExpenseSummaryDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetExpenseSummaryQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<ExpenseSummaryDto>> Handle(GetExpenseSummaryQuery request, CancellationToken cancellationToken)
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

        // Toplamlar SQL'de hesaplanır; saklanmaz
        var (total, mealCardTotal, count) = await _unitOfWork.Expenses.GetTotalsAsync(filter);
        var byCategory = await _unitOfWork.Expenses.GetTotalsByCategoryAsync(filter);
        var byPaymentMethod = await _unitOfWork.Expenses.GetTotalsByPaymentMethodAsync(filter);

        var summary = new ExpenseSummaryDto
        {
            Total = total,
            MealCardTotal = mealCardTotal,
            Count = count,
            ByCategory = byCategory
                .Select(x => new ExpenseCategoryTotalDto
                {
                    CategoryId = x.CategoryId,
                    CategoryName = x.CategoryName,
                    Total = x.Total
                })
                .ToList(),
            ByPaymentMethod = byPaymentMethod
                .Select(x => new ExpensePaymentMethodTotalDto
                {
                    PaymentMethodId = x.PaymentMethodId,
                    PaymentMethodName = x.PaymentMethodName,
                    Type = x.Type,
                    Total = x.Total
                })
                .ToList()
        };

        return Result<ExpenseSummaryDto>.Success(summary);
    }
}
