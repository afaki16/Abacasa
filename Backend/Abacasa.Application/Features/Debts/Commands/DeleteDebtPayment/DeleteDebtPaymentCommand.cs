using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.Debts.Commands.DeleteDebtPayment;

public class DeleteDebtPaymentCommand : IRequest<Result<bool>>
{
    public int DebtId { get; set; }
    public int PaymentId { get; set; }
}
