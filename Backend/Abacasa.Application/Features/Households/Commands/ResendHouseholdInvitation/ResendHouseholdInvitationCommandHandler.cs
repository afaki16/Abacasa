using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Households.Common;
using Abacasa.Application.Features.Households.Dtos;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Abacasa.Application.Features.Households.Commands.ResendHouseholdInvitation;

public class ResendHouseholdInvitationCommandHandler : IRequestHandler<ResendHouseholdInvitationCommand, Result<HouseholdInvitationSendResultDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ResendHouseholdInvitationCommandHandler> _logger;
    private readonly IJsonStringLocalizer _localizer;

    public ResendHouseholdInvitationCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService,
        IEmailService emailService, IConfiguration configuration,
        ILogger<ResendHouseholdInvitationCommandHandler> logger, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _emailService = emailService;
        _configuration = configuration;
        _logger = logger;
        _localizer = localizer;
    }

    public async Task<Result<HouseholdInvitationSendResultDto>> Handle(ResendHouseholdInvitationCommand request, CancellationToken cancellationToken)
    {
        // Filtreli repository: başka hanenin daveti 404
        var invitation = await _unitOfWork.HouseholdInvitations.GetWithPersonAsync(request.Id);
        if (invitation == null)
            return Result<HouseholdInvitationSendResultDto>.Failure(Error.Failure(ErrorCode.NotFound, _localizer["households.invitationNotFound"]));

        var now = DateTime.UtcNow;
        var status = invitation.GetStatus(now);
        if (status != HouseholdInvitationStatus.Pending && status != HouseholdInvitationStatus.Expired)
            return Result<HouseholdInvitationSendResultDto>.Failure(Error.Failure(ErrorCode.ValidationFailed, _localizer["households.invitationNotResendable"]));

        var tenant = await _unitOfWork.Tenants.GetByIdAsync(invitation.TenantId);
        var inviter = _currentUserService.UserId is int userId ? await _unitOfWork.Users.GetByIdAsync(userId) : null;

        var (plainToken, tokenHash) = HouseholdInvitations.NewToken();
        invitation.TokenHash = tokenHash;
        invitation.ExpiresAt = now.Add(HouseholdInvitation.Validity);
        _unitOfWork.HouseholdInvitations.Update(invitation);
        await _unitOfWork.SaveChangesAsync();

        var emailSent = await HouseholdInvitations.SendAsync(_emailService, _configuration, _logger,
            invitation, plainToken, inviter?.FullName ?? string.Empty, tenant?.Name ?? string.Empty);

        var dto = HouseholdMapping.ToDto<HouseholdInvitationSendResultDto>(invitation, now);
        dto.EmailSent = emailSent;
        return Result<HouseholdInvitationSendResultDto>.Success(dto);
    }
}
