using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Expenses.Dtos;
using MediatR;
using System;

namespace Abacasa.Application.Features.Expenses.Queries.GetExpenseSummary;

public class GetExpenseSummaryQuery : IRequest<Result<ExpenseSummaryDto>>
{
    public string SearchTerm { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public int? CategoryId { get; set; }
    public int? PaymentMethodId { get; set; }
    public int? OwnerPersonId { get; set; }
}
