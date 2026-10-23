using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Abacasa.Application.Features.Auth.Commands.DeleteAccount;

public class DeleteAccountCommandHandler : IRequestHandler<DeleteAccountCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPasswordService _passwordService;
    private readonly IHouseholdEraser _householdEraser;
    private readonly IUserAnonymizer _userAnonymizer;
    private readonly IPermissionService _permissionService;
    private readonly ILogger<DeleteAccountCommandHandler> _logger;
    private readonly IJsonStringLocalizer _localizer;

    public DeleteAccountCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService,
        IPasswordService passwordService, IHouseholdEraser householdEraser, IUserAnonymizer userAnonymizer,
        IPermissionService permissionService, ILogger<DeleteAccountCommandHandler> logger, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _passwordService = passwordService;
        _householdEraser = householdEraser;
        _userAnonymizer = userAnonymizer;
        _permissionService = permissionService;
        _logger = logger;
        _localizer = localizer;
    }

    public async Task<Result<bool>> Handle(DeleteAccountCommand request, CancellationToken cancellationToken)
    {
        var user = _currentUserService.UserId is int userId ? await _unitOfWork.Users.GetByIdAsync(userId) : null;
        if (user == null)
            return Result<bool>.Failure(Error.Failure(ErrorCode.Unauthorized, _localizer["auth.userNotAuthenticated"]));

        var passwordCheck = _passwordService.VerifyPassword(request.Password ?? string.Empty, user.PasswordHash);
        if (!passwordCheck.IsSuccess || !passwordCheck.Value)
            return Result<bool>.Failure(Error.Failure(ErrorCode.ValidationFailed, _localizer["auth.passwordIncorrect"]));

        var plan = await AccountDeletionPlan.BuildAsync(_unitOfWork, user.Id);

        if (plan.IsLastSuperAdmin)
            return Result<bool>.Failure(Error.Failure(ErrorCode.ValidationFailed, _localizer["account.lastSuperAdmin"]));

        if (plan.BlockedHouseholds.Count > 0)
            return Result<bool>.Failure(Error.Failure(ErrorCode.ValidationFailed,
                _localizer["account.blockedHouseholds", string.Join(", ", plan.BlockedHouseholds.Select(h => h.Name))]));

        if (plan.HouseholdsToDelete.Count > 0 && !request.DeleteSoleHouseholds)
            return Result<bool>.Failure(Error.Failure(ErrorCode.ValidationFailed,
                _localizer["account.soleHouseholdsNotConfirmed", string.Join(", ", plan.HouseholdsToDelete.Select(h => h.Name))]));

        var affectedUsers = new HashSet<int> { user.Id };
        await _unitOfWork.ExecuteInTransactionAsync(async () =>
        {
            // Tek üyesi olduğu haneler bütün verileriyle; ardından kalan üyelikler, token'lar ve anonimleştirme
            foreach (var household in plan.HouseholdsToDelete)
                affectedUsers.UnionWith(await _householdEraser.EraseAsync(household.Id, cancellationToken));

            await _userAnonymizer.AnonymizeAsync(user.Id, cancellationToken);
        }, cancellationToken);

        foreach (var affectedUserId in affectedUsers)
            _permissionService.ClearUserPermissionCache(affectedUserId);

        _logger.LogWarning("Hesap silindi (anonimlestirildi). UserId: {UserId}, silinen hane: {Count}", user.Id, plan.HouseholdsToDelete.Count);
        return Result<bool>.Success(true);
    }
}
