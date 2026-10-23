using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Abacasa.Application.Features.Households.Commands.DeleteHousehold;

public class DeleteHouseholdCommandHandler : IRequestHandler<DeleteHouseholdCommand, Result<bool>>
{
    // Seed haneleri (hane 1 ve 2) silinemez
    private static readonly string[] ProtectedDomains = { "default", "demo" };

    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPasswordService _passwordService;
    private readonly IHouseholdEraser _householdEraser;
    private readonly IPermissionService _permissionService;
    private readonly ILogger<DeleteHouseholdCommandHandler> _logger;
    private readonly IJsonStringLocalizer _localizer;

    public DeleteHouseholdCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService,
        IPasswordService passwordService, IHouseholdEraser householdEraser, IPermissionService permissionService,
        ILogger<DeleteHouseholdCommandHandler> logger, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _passwordService = passwordService;
        _householdEraser = householdEraser;
        _permissionService = permissionService;
        _logger = logger;
        _localizer = localizer;
    }

    public async Task<Result<bool>> Handle(DeleteHouseholdCommand request, CancellationToken cancellationToken)
    {
        var tenant = _currentUserService.TenantId is int tenantId ? await _unitOfWork.Tenants.GetByIdAsync(tenantId) : null;
        var user = _currentUserService.UserId is int userId ? await _unitOfWork.Users.GetByIdAsync(userId) : null;
        if (tenant == null || user == null)
            return Result<bool>.Failure(Error.Failure(ErrorCode.NotFound, _localizer["households.notFound"]));

        var passwordCheck = _passwordService.VerifyPassword(request.Password ?? string.Empty, user.PasswordHash);
        if (!passwordCheck.IsSuccess || !passwordCheck.Value)
            return Result<bool>.Failure(Error.Failure(ErrorCode.ValidationFailed, _localizer["auth.passwordIncorrect"]));

        if ((request.ConfirmName ?? string.Empty).Trim() != tenant.Name.Trim())
            return Result<bool>.Failure(Error.Failure(ErrorCode.ValidationFailed, _localizer["households.confirmNameMismatch"]));

        if (tenant.Domain != null && ProtectedDomains.Contains(tenant.Domain))
            return Result<bool>.Failure(Error.Failure(ErrorCode.ValidationFailed, _localizer["households.cannotDelete"]));

        var affectedUsers = await _unitOfWork.ExecuteInTransactionAsync(
            () => _householdEraser.EraseAsync(tenant.Id, cancellationToken), cancellationToken);

        // Üyelerin o hanedeki token'ları 401 alır (üyelik yok); izinleri yeniden hesaplanır
        foreach (var affectedUserId in affectedUsers)
            _permissionService.ClearUserPermissionCache(affectedUserId);

        _logger.LogWarning("Hane silindi. TenantId: {TenantId}, silen: {UserId}", tenant.Id, user.Id);
        return Result<bool>.Success(true);
    }
}
