using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Households.Commands.RemoveHouseholdMember;

public class RemoveHouseholdMemberCommandHandler : IRequestHandler<RemoveHouseholdMemberCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPermissionService _permissionService;
    private readonly IJsonStringLocalizer _localizer;

    public RemoveHouseholdMemberCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService,
        IPermissionService permissionService, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _permissionService = permissionService;
        _localizer = localizer;
    }

    public async Task<Result<bool>> Handle(RemoveHouseholdMemberCommand request, CancellationToken cancellationToken)
    {
        var membership = _currentUserService.TenantId is int tenantId
            ? await _unitOfWork.TenantMemberships.GetInTenantAsync(request.MembershipId, tenantId)
            : null;
        if (membership == null)
            return Result<bool>.Failure(Error.Failure(ErrorCode.NotFound, _localizer["households.memberNotFound"]));

        if (membership.UserId == _currentUserService.UserId)
            return Result<bool>.Failure(Error.Failure(ErrorCode.ValidationFailed, _localizer["households.cannotRemoveSelf"]));

        if (membership.Role == HouseholdRole.Admin
            && await _unitOfWork.TenantMemberships.CountAdminsByTenantAsync(membership.TenantId) <= 1)
            return Result<bool>.Failure(Error.Failure(ErrorCode.ValidationFailed, _localizer["households.lastAdmin"]));

        _unitOfWork.TenantMemberships.SoftDelete(membership);
        await _unitOfWork.SaveChangesAsync();

        // Hedefin bu hanedeki oturumu bir sonraki istekte 401 alır (OnTokenValidated üyelik kontrolü)
        _permissionService.ClearUserPermissionCache(membership.UserId);

        return Result<bool>.Success(true);
    }
}
