using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Budgets.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Budgets.Commands.UpdateBudget;

public class UpdateBudgetCommand : IRequest<Result<BudgetDto>>
{
    public int Id { get; set; }
    public int? OwnerPersonId { get; set; }
    public int StartYear { get; set; }
    public int StartMonth { get; set; }
    public decimal Amount { get; set; }
    public string? Note { get; set; }
}
