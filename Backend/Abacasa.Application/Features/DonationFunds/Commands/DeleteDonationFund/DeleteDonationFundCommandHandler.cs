using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.DonationFunds.Commands.DeleteDonationFund;

public class DeleteDonationFundCommandHandler : IRequestHandler<DeleteDonationFundCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJsonStringLocalizer _localizer;

    public DeleteDonationFundCommandHandler(IUnitOfWork unitOfWork, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<bool>> Handle(DeleteDonationFundCommand request, CancellationToken cancellationToken)
    {
        var fund = await _unitOfWork.DonationFunds.GetByIdAsync(request.Id);

        if (fund == null)
            return Result<bool>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["donationFunds.notFound"]));

        // Dağıtımı ya da hareketi olan emanet silinemez
        var totals = (await _unitOfWork.DonationFunds.GetTotalsAsync(new[] { fund.Id }))[fund.Id];
        if (totals.DistributionCount > 0 || totals.MovementCount > 0)
            return Result<bool>.Failure(Error.Failure(
                ErrorCode.InvalidOperation,
                _localizer["donationFunds.hasRecords"],
                409));

        _unitOfWork.DonationFunds.SoftDelete(fund);
        await _unitOfWork.SaveChangesAsync();

        return Result<bool>.Success(true);
    }
}
