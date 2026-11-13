using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Budgets.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Budgets.Commands.CreateBudget;

public class CreateBudgetCommand : IRequest<Result<BudgetDto>>
{
    public int? OwnerPersonId { get; set; }
    public int StartYear { get; set; }
    public int StartMonth { get; set; }
    public decimal Amount { get; set; }
    public string? Note { get; set; }
}
