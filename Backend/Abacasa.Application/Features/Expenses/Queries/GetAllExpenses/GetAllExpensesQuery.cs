using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Expenses.Dtos;
using MediatR;
using System;

namespace Abacasa.Application.Features.Expenses.Queries.GetAllExpenses;

public class GetAllExpensesQuery : IRequest<PagedResult<ExpenseListDto>>
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string SearchTerm { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public int? CategoryId { get; set; }
    public int? PaymentMethodId { get; set; }
    public int? OwnerPersonId { get; set; }
}
