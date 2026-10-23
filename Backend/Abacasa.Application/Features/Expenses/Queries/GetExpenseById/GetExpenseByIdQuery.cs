using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Expenses.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Expenses.Queries.GetExpenseById;

public class GetExpenseByIdQuery : IRequest<Result<ExpenseDto>>
{
    public int Id { get; set; }
}
