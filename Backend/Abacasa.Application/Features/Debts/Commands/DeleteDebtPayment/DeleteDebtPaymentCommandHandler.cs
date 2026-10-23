using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;
using System.Linq;

namespace Abacasa.Application.Features.Debts.Commands.DeleteDebtPayment;

public class DeleteDebtPaymentCommandHandler : IRequestHandler<DeleteDebtPaymentCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJsonStringLocalizer _localizer;

    public DeleteDebtPaymentCommandHandler(IUnitOfWork unitOfWork, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<bool>> Handle(DeleteDebtPaymentCommand request, CancellationToken cancellationToken)
    {
        var debt = await _unitOfWork.Debts.GetWithRelationsAsync(request.DebtId);

        if (debt == null)
            return Result<bool>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["debts.notFound"]));

        // Ödeme bu borca ait değilse bulunamadı sayılır
        var payment = debt.Payments.FirstOrDefault(p => p.Id == request.PaymentId);
        if (payment == null)
            return Result<bool>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["debts.paymentNotFound"]));

        _unitOfWork.DebtPayments.SoftDelete(payment);
        await _unitOfWork.SaveChangesAsync();

        return Result<bool>.Success(true);
    }
}
