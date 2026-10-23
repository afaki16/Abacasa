using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Households.Common;
using Abacasa.Application.Features.Households.Dtos;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Households.Commands.CreateHousehold;

// Yeni hane tek transaction'da HouseholdSetup ile açılır (e-posta doğrulamasındaki hane açılışıyla ortak).
// Hane değiştirme ayrı çağrıyla yapılır.
public class CreateHouseholdCommandHandler : IRequestHandler<CreateHouseholdCommand, Result<HouseholdDto>>
{
    // Kullanıcı başına en fazla canlı yönetici üyeliği
    public const int MaxAdminMemberships = 10;

    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPermissionService _permissionService;
    private readonly IJsonStringLocalizer _localizer;

    public CreateHouseholdCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService,
        IPermissionService permissionService, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _permissionService = permissionService;
        _localizer = localizer;
    }

    public async Task<Result<HouseholdDto>> Handle(CreateHouseholdCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId is not int userId)
            return Result<HouseholdDto>.Failure(Error.Failure(ErrorCode.Unauthorized, _localizer["auth.userNotAuthenticated"]));

        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
            return Result<HouseholdDto>.Failure(Error.Failure(ErrorCode.Unauthorized, _localizer["auth.userNotAuthenticated"]));

        if (await _unitOfWork.TenantMemberships.CountAdminMembershipsAsync(userId) >= MaxAdminMemberships)
            return Result<HouseholdDto>.Failure(Error.Failure(
                ErrorCode.ValidationFailed,
                _localizer["households.adminLimit", MaxAdminMemberships]));

        var name = request.Name.Trim();

        var tenant = await _unitOfWork.ExecuteInTransactionAsync(() => HouseholdSetup.CreateAsync(_unitOfWork, user, name));

        // Üyelikler değişti: kullanıcının bütün hane izin önbelleği düşer
        _permissionService.ClearUserPermissionCache(userId);

        return Result<HouseholdDto>.Success(new HouseholdDto { Id = tenant.Id, Name = tenant.Name });
    }
}
