using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Households.Common;
using Abacasa.Application.Features.Households.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Households.Queries.GetInvitationByToken;

public class GetInvitationByTokenQueryHandler : IRequestHandler<GetInvitationByTokenQuery, Result<InvitationInfoDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJsonStringLocalizer _localizer;

    public GetInvitationByTokenQueryHandler(IUnitOfWork unitOfWork, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<InvitationInfoDto>> Handle(GetInvitationByTokenQuery request, CancellationToken cancellationToken)
    {
        // Hane filtresi dışında token hash'iyle aranır
        var invitation = await _unitOfWork.HouseholdInvitations.GetByTokenHashAsync(HouseholdInvitations.HashToken(request.Token));
        if (invitation == null)
            return Result<InvitationInfoDto>.Failure(Error.Failure(ErrorCode.NotFound, _localizer["households.invitationNotFound"]));

        var tenant = await _unitOfWork.Tenants.GetByIdAsync(invitation.TenantId);

        return Result<InvitationInfoDto>.Success(new InvitationInfoDto
        {
            HouseholdName = tenant?.Name ?? string.Empty,
            InviterName = invitation.InvitedByUser?.FullName ?? string.Empty,
            Email = invitation.Email,
            Role = invitation.Role.ToString(),
            Status = invitation.GetStatus(DateTime.UtcNow).ToString(),
            UserExists = await _unitOfWork.Users.EmailExistsAsync(invitation.Email)
        });
    }
}
