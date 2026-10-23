using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Households.Commands.LeaveHousehold;

public class LeaveHouseholdCommandHandler : IRequestHandler<LeaveHouseholdCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPermissionService _permissionService;
    private readonly IJsonStringLocalizer _localizer;

    public LeaveHouseholdCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService,
        IPermissionService permissionService, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _permissionService = permissionService;
        _localizer = localizer;
    }

    public async Task<Result<bool>> Handle(LeaveHouseholdCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId is not int userId || _currentUserService.TenantId is not int tenantId)
            return Result<bool>.Failure(Error.Failure(ErrorCode.ValidationFailed, _localizer["households.noActiveHousehold"]));

        var membership = await _unitOfWork.TenantMemberships.GetActiveAsync(userId, tenantId);
        if (membership == null)
            return Result<bool>.Failure(Error.Failure(ErrorCode.NotFound, _localizer["households.memberNotFound"]));

        if (await _unitOfWork.TenantMemberships.CountByTenantAsync(tenantId) <= 1)
            return Result<bool>.Failure(Error.Failure(ErrorCode.ValidationFailed, _localizer["households.lastMember"]));

        if (membership.Role == HouseholdRole.Admin
            && await _unitOfWork.TenantMemberships.CountAdminsByTenantAsync(tenantId) <= 1)
            return Result<bool>.Failure(Error.Failure(ErrorCode.ValidationFailed, _localizer["households.lastAdmin"]));

        _unitOfWork.TenantMemberships.SoftDelete(membership);
        await _unitOfWork.SaveChangesAsync();

        _permissionService.ClearUserPermissionCache(userId);

        return Result<bool>.Success(true);
    }
}
