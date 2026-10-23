using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.Expenses.Commands.DeleteExpense;

public class DeleteExpenseCommand : IRequest<Result<bool>>
{
    public int Id { get; set; }
}
