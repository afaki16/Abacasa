using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.RecurringPayments.Commands.DeleteRecurringPayment;

public class DeleteRecurringPaymentCommandHandler : IRequestHandler<DeleteRecurringPaymentCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJsonStringLocalizer _localizer;

    public DeleteRecurringPaymentCommandHandler(IUnitOfWork unitOfWork, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<bool>> Handle(DeleteRecurringPaymentCommand request, CancellationToken cancellationToken)
    {
        var plan = await _unitOfWork.RecurringPayments.GetByIdAsync(request.Id);

        if (plan == null)
            return Result<bool>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["recurringPayments.notFound"]));

        // Bağlı canlı harcama/bağışı olan plan silinemez; pasif yapılabilir
        if (await _unitOfWork.RecurringPayments.HasPaymentsAsync(plan.Id))
            return Result<bool>.Failure(Error.Failure(
                ErrorCode.InvalidOperation,
                _localizer["recurringPayments.hasPayments"],
                409));

        _unitOfWork.RecurringPayments.SoftDelete(plan);
        await _unitOfWork.SaveChangesAsync();

        return Result<bool>.Success(true);
    }
}
