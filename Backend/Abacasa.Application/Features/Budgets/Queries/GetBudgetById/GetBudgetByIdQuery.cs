using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Budgets.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Budgets.Queries.GetBudgetById;

public class GetBudgetByIdQuery : IRequest<Result<BudgetDto>>
{
    public int Id { get; set; }
}
