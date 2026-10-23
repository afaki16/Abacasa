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

namespace Abacasa.Application.Features.Households.Commands.CreateHouseholdInvitation;

public class CreateHouseholdInvitationCommandHandler : IRequestHandler<CreateHouseholdInvitationCommand, Result<HouseholdInvitationSendResultDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CreateHouseholdInvitationCommandHandler> _logger;
    private readonly IJsonStringLocalizer _localizer;

    public CreateHouseholdInvitationCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService,
        IEmailService emailService, IConfiguration configuration,
        ILogger<CreateHouseholdInvitationCommandHandler> logger, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _emailService = emailService;
        _configuration = configuration;
        _logger = logger;
        _localizer = localizer;
    }

    public async Task<Result<HouseholdInvitationSendResultDto>> Handle(CreateHouseholdInvitationCommand request, CancellationToken cancellationToken)
    {
        var tenant = _currentUserService.TenantId is int tenantId ? await _unitOfWork.Tenants.GetByIdAsync(tenantId) : null;
        var inviter = _currentUserService.UserId is int userId ? await _unitOfWork.Users.GetByIdAsync(userId) : null;
        if (tenant == null || inviter == null)
            return Result<HouseholdInvitationSendResultDto>.Failure(Error.Failure(ErrorCode.NotFound, _localizer["households.notFound"]));

        var email = HouseholdInvitations.NormalizeEmail(request.Email);
        var now = DateTime.UtcNow;

        if (await _unitOfWork.TenantMemberships.IsEmailMemberAsync(email, tenant.Id))
            return Result<HouseholdInvitationSendResultDto>.Failure(Error.Failure(ErrorCode.AlreadyExists, _localizer["households.alreadyMember"]));

        if (await _unitOfWork.HouseholdInvitations.HasPendingForEmailAsync(email, now))
            return Result<HouseholdInvitationSendResultDto>.Failure(Error.Failure(ErrorCode.AlreadyExists, _localizer["households.pendingInvitationExists"]));

        if (request.PersonId is int personId)
        {
            var personError = await HouseholdInvitations.ValidatePersonAsync(_unitOfWork, _localizer, personId);
            if (personError != null)
                return Result<HouseholdInvitationSendResultDto>.Failure(personError);
        }

        var (plainToken, tokenHash) = HouseholdInvitations.NewToken();
        var invitation = new HouseholdInvitation
        {
            Email = email,
            Role = request.Role,
            PersonId = request.PersonId,
            TokenHash = tokenHash,
            ExpiresAt = now.Add(HouseholdInvitation.Validity),
            InvitedByUserId = inviter.Id
        };
        await _unitOfWork.HouseholdInvitations.AddAsync(invitation);
        await _unitOfWork.SaveChangesAsync();

        var emailSent = await HouseholdInvitations.SendAsync(_emailService, _configuration, _logger,
            invitation, plainToken, inviter.FullName, tenant.Name);

        var invitationWithPerson = await _unitOfWork.HouseholdInvitations.GetWithPersonAsync(invitation.Id);
        var dto = HouseholdMapping.ToDto<HouseholdInvitationSendResultDto>(invitationWithPerson ?? invitation, now);
        dto.EmailSent = emailSent;
        return Result<HouseholdInvitationSendResultDto>.Success(dto);
    }
}
