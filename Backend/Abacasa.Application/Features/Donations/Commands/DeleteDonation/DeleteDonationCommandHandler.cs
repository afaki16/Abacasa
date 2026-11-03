using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Households.Common;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Donations.Commands.DeleteDonation;

public class DeleteDonationCommandHandler : IRequestHandler<DeleteDonationCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJsonStringLocalizer _localizer;
    private readonly ICurrentUserService _currentUserService;

    public DeleteDonationCommandHandler(IUnitOfWork unitOfWork, IJsonStringLocalizer localizer, ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
        _currentUserService = currentUserService;
    }

    public async Task<Result<bool>> Handle(DeleteDonationCommand request, CancellationToken cancellationToken)
    {
        var donation = await _unitOfWork.Donations.GetByIdAsync(request.Id);

        if (donation == null)
            return Result<bool>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["donations.notFound"]));

        // Emanetten dağıtılmış bağışı silmek emanetten ayırmakla aynı etkiyi yapar (elde artar); ayırma gibi modüle bağlı
        if (donation.FundId.HasValue && !await HouseholdModules.IsDonationExtrasEnabledAsync(_unitOfWork, _currentUserService))
            return Result<bool>.Failure(HouseholdModules.DisabledError(_localizer));

        _unitOfWork.Donations.SoftDelete(donation);
        await _unitOfWork.SaveChangesAsync();

        return Result<bool>.Success(true);
    }
}
