using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Budgets.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Budgets.Queries.GetAllBudgets;

public class GetAllBudgetsQuery : IRequest<PagedResult<BudgetDto>>
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
