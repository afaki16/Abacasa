using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Debts.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Debts.Queries.GetDebtSummary;

public class GetDebtSummaryQuery : IRequest<Result<DebtSummaryDto>>
{
}
