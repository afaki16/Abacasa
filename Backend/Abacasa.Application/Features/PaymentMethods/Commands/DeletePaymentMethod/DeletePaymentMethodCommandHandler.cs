using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.PaymentMethods.Commands.DeletePaymentMethod;

public class DeletePaymentMethodCommandHandler : IRequestHandler<DeletePaymentMethodCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJsonStringLocalizer _localizer;

    public DeletePaymentMethodCommandHandler(IUnitOfWork unitOfWork, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<bool>> Handle(DeletePaymentMethodCommand request, CancellationToken cancellationToken)
    {
        var paymentMethod = await _unitOfWork.PaymentMethods.GetByIdAsync(request.Id);

        if (paymentMethod == null)
            return Result<bool>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["paymentMethods.notFound"]));

        // Bağlı silinmemiş harcaması olan ödeme aracı silinemez; pasif yapılabilir
        if (await _unitOfWork.PaymentMethods.IsInUseAsync(paymentMethod.Id))
            return Result<bool>.Failure(Error.Failure(
                ErrorCode.InvalidOperation,
                _localizer["paymentMethods.inUse"],
                409));

        _unitOfWork.PaymentMethods.SoftDelete(paymentMethod);
        await _unitOfWork.SaveChangesAsync();

        return Result<bool>.Success(true);
    }
}
