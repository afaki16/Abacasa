using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.DonationTargets.Commands.DeleteDonationTarget;

public class DeleteDonationTargetCommandHandler : IRequestHandler<DeleteDonationTargetCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJsonStringLocalizer _localizer;

    public DeleteDonationTargetCommandHandler(IUnitOfWork unitOfWork, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<bool>> Handle(DeleteDonationTargetCommand request, CancellationToken cancellationToken)
    {
        // Hedefe bağlı kayıt yok; bağışlar hedefe kişi, yıl ve türle eşlenir
        var target = await _unitOfWork.DonationTargets.GetByIdAsync(request.Id);

        if (target == null)
            return Result<bool>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["donationTargets.notFound"]));

        _unitOfWork.DonationTargets.SoftDelete(target);
        await _unitOfWork.SaveChangesAsync();

        return Result<bool>.Success(true);
    }
}
