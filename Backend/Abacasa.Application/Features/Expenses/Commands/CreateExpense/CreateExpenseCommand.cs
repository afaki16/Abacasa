using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Expenses.Dtos;
using MediatR;
using System;

namespace Abacasa.Application.Features.Expenses.Commands.CreateExpense;

public class CreateExpenseCommand : IRequest<Result<ExpenseListDto>>
{
    public DateOnly Date { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public int CategoryId { get; set; }
    public int PaymentMethodId { get; set; }
    public int? OwnerPersonId { get; set; }
}
