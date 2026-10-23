using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Debts.Dtos;
using MediatR;
using System.Collections.Generic;

namespace Abacasa.Application.Features.Debts.Queries.GetDebtPayments;

public class GetDebtPaymentsQuery : IRequest<Result<List<DebtPaymentDto>>>
{
    public int DebtId { get; set; }
}
