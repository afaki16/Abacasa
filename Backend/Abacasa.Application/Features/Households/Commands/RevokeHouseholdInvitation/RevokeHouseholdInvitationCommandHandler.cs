using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Households.Commands.RevokeHouseholdInvitation;

public class RevokeHouseholdInvitationCommandHandler : IRequestHandler<RevokeHouseholdInvitationCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJsonStringLocalizer _localizer;

    public RevokeHouseholdInvitationCommandHandler(IUnitOfWork unitOfWork, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<bool>> Handle(RevokeHouseholdInvitationCommand request, CancellationToken cancellationToken)
    {
        // Filtreli repository: başka hanenin daveti 404
        var invitation = await _unitOfWork.HouseholdInvitations.GetByIdAsync(request.Id);
        if (invitation == null)
            return Result<bool>.Failure(Error.Failure(ErrorCode.NotFound, _localizer["households.invitationNotFound"]));

        if (invitation.GetStatus(DateTime.UtcNow) != HouseholdInvitationStatus.Pending)
            return Result<bool>.Failure(Error.Failure(ErrorCode.ValidationFailed, _localizer["households.invitationNotPending"]));

        invitation.RevokedAt = DateTime.UtcNow;
        _unitOfWork.HouseholdInvitations.Update(invitation);
        await _unitOfWork.SaveChangesAsync();

        return Result<bool>.Success(true);
    }
}
