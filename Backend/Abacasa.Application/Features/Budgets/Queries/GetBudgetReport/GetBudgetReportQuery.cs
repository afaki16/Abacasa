using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Budgets.Dtos;
using MediatR;
using System;

namespace Abacasa.Application.Features.Budgets.Queries.GetBudgetReport;

public class GetBudgetReportQuery : IRequest<Result<BudgetReportDto>>
{
    public int Year { get; set; }
    public int Month { get; set; }
    /// İstemcinin bugünü; kalan gün ve günlük limit buna göre
    public DateOnly? Today { get; set; }
}
