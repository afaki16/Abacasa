using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Households.Common;
using Abacasa.Application.Features.Households.Dtos;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Households.Commands.UpdateHouseholdMember;

public class UpdateHouseholdMemberCommandHandler : IRequestHandler<UpdateHouseholdMemberCommand, Result<HouseholdMemberDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPermissionService _permissionService;
    private readonly IJsonStringLocalizer _localizer;

    public UpdateHouseholdMemberCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService,
        IPermissionService permissionService, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _permissionService = permissionService;
        _localizer = localizer;
    }

    public async Task<Result<HouseholdMemberDto>> Handle(UpdateHouseholdMemberCommand request, CancellationToken cancellationToken)
    {
        // Üyelik hane filtresine girmez: aktif haneyle aranır, başka hanenin üyeliği 404
        var membership = _currentUserService.TenantId is int tenantId
            ? await _unitOfWork.TenantMemberships.GetInTenantAsync(request.MembershipId, tenantId)
            : null;
        if (membership == null)
            return Result<HouseholdMemberDto>.Failure(Error.Failure(ErrorCode.NotFound, _localizer["households.memberNotFound"]));

        // Hanede her zaman en az bir yönetici kalır
        if (membership.Role == HouseholdRole.Admin && request.Role != HouseholdRole.Admin
            && await _unitOfWork.TenantMemberships.CountAdminsByTenantAsync(membership.TenantId) <= 1)
            return Result<HouseholdMemberDto>.Failure(Error.Failure(ErrorCode.ValidationFailed, _localizer["households.lastAdmin"]));

        if (request.PersonId is int personId && personId != membership.PersonId)
        {
            var personError = await HouseholdInvitations.ValidatePersonAsync(_unitOfWork, _localizer, personId, excludeMembershipId: membership.Id);
            if (personError != null)
                return Result<HouseholdMemberDto>.Failure(personError);

            membership.AssignPerson((await _unitOfWork.People.GetByIdAsync(personId))!);
        }
        else if (request.PersonId == null)
        {
            membership.PersonId = null;
            membership.Person = null;
        }

        membership.Role = request.Role;
        _unitOfWork.TenantMemberships.Update(membership);
        await _unitOfWork.SaveChangesAsync();

        // Rol değişti: hedefin izinleri bir sonraki istekte yeniden hesaplanır
        _permissionService.ClearUserPermissionCache(membership.UserId);

        return Result<HouseholdMemberDto>.Success(new HouseholdMemberDto
        {
            MembershipId = membership.Id,
            UserId = membership.UserId,
            FullName = membership.User.FullName,
            Email = membership.User.Email,
            Role = membership.Role.ToString(),
            PersonId = membership.PersonId,
            PersonName = membership.Person?.Name,
            JoinedAt = membership.CreatedDate,
            IsCurrentUser = membership.UserId == _currentUserService.UserId
        });
    }
}
