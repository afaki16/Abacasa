using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Donations.Commands.DeleteDonation;

public class DeleteDonationCommandHandler : IRequestHandler<DeleteDonationCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJsonStringLocalizer _localizer;

    public DeleteDonationCommandHandler(IUnitOfWork unitOfWork, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<bool>> Handle(DeleteDonationCommand request, CancellationToken cancellationToken)
    {
        var donation = await _unitOfWork.Donations.GetByIdAsync(request.Id);

        if (donation == null)
            return Result<bool>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["donations.notFound"]));

        _unitOfWork.Donations.SoftDelete(donation);
        await _unitOfWork.SaveChangesAsync();

        return Result<bool>.Success(true);
    }
}
