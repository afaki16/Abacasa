using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.Budgets.Commands.DeleteBudget;

public class DeleteBudgetCommand : IRequest<Result<bool>>
{
    public int Id { get; set; }
}
