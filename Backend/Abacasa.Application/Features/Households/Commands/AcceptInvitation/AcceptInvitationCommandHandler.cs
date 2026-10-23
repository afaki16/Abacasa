using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Households.Common;
using Abacasa.Application.Features.Households.Dtos;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Households.Commands.AcceptInvitation;

public class AcceptInvitationCommandHandler : IRequestHandler<AcceptInvitationCommand, Result<AcceptInvitationResultDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPermissionService _permissionService;
    private readonly IJsonStringLocalizer _localizer;

    public AcceptInvitationCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService,
        IPermissionService permissionService, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _permissionService = permissionService;
        _localizer = localizer;
    }

    public async Task<Result<AcceptInvitationResultDto>> Handle(AcceptInvitationCommand request, CancellationToken cancellationToken)
    {
        var user = _currentUserService.UserId is int userId ? await _unitOfWork.Users.GetByIdAsync(userId) : null;
        if (user == null)
            return Result<AcceptInvitationResultDto>.Failure(Error.Failure(ErrorCode.Unauthorized, _localizer["auth.userNotAuthenticated"]));

        var invitation = await _unitOfWork.HouseholdInvitations.GetByTokenHashAsync(HouseholdInvitations.HashToken(request.Token));
        if (invitation == null)
            return Result<AcceptInvitationResultDto>.Failure(Error.Failure(ErrorCode.NotFound, _localizer["households.invitationNotFound"]));

        if (invitation.GetStatus(DateTime.UtcNow) != HouseholdInvitationStatus.Pending)
            return Result<AcceptInvitationResultDto>.Failure(Error.Failure(ErrorCode.ValidationFailed, _localizer["households.invitationNotPending"]));

        if (!string.Equals(invitation.Email, HouseholdInvitations.NormalizeEmail(user.Email), StringComparison.Ordinal))
            return Result<AcceptInvitationResultDto>.Failure(Error.Failure(ErrorCode.Forbidden, _localizer["households.invitationEmailMismatch"]));

        // Zaten canlı üyeyse yalnızca Accepted işaretlenir (tekrar denemeye dayanıklı)
        await _unitOfWork.ExecuteInTransactionAsync(() => HouseholdInvitations.AcceptAsync(_unitOfWork, invitation, user));

        _permissionService.ClearUserPermissionCache(user.Id);

        return Result<AcceptInvitationResultDto>.Success(new AcceptInvitationResultDto { TenantId = invitation.TenantId });
    }
}
