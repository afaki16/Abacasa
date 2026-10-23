using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.DonationFunds.Common;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.DonationFunds.Commands.DeleteFundMovement;

public class DeleteFundMovementCommandHandler : IRequestHandler<DeleteFundMovementCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJsonStringLocalizer _localizer;

    public DeleteFundMovementCommandHandler(IUnitOfWork unitOfWork, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<bool>> Handle(DeleteFundMovementCommand request, CancellationToken cancellationToken)
    {
        var fund = await _unitOfWork.DonationFunds.GetByIdAsync(request.FundId);

        if (fund == null)
            return Result<bool>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["donationFunds.notFound"]));

        // Hareket bu emanete ait değilse bulunamadı sayılır
        var movement = await _unitOfWork.FundMovements.GetByIdAsync(request.MovementId);
        if (movement == null || movement.FundId != fund.Id)
            return Result<bool>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["donationFunds.movementNotFound"]));

        // Silindikten sonra kullanımda ≥ 0 ve elde ≥ 0 olmalı (ör. yerine koyma silinirse elde azalır)
        var totals = (await _unitOfWork.DonationFunds.GetTotalsAsync(new[] { fund.Id }, excludeMovementId: movement.Id))[fund.Id];
        var violation = FundBalance.From(fund, totals).ViolationKey();
        if (violation != null)
            return Result<bool>.Failure(Error.Failure(ErrorCode.ValidationFailed, _localizer[violation]));

        _unitOfWork.FundMovements.SoftDelete(movement);
        await _unitOfWork.SaveChangesAsync();

        return Result<bool>.Success(true);
    }
}
