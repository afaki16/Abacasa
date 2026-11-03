using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Users.Dtos;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Households.Commands.UpdateHouseholdModules;

public class UpdateHouseholdModulesCommandHandler : IRequestHandler<UpdateHouseholdModulesCommand, Result<HouseholdModulesDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IJsonStringLocalizer _localizer;

    public UpdateHouseholdModulesCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _localizer = localizer;
    }

    public async Task<Result<HouseholdModulesDto>> Handle(UpdateHouseholdModulesCommand request, CancellationToken cancellationToken)
    {
        var tenant = _currentUserService.TenantId is int tenantId ? await _unitOfWork.Tenants.GetByIdAsync(tenantId) : null;
        if (tenant == null)
            return Result<HouseholdModulesDto>.Failure(Error.Failure(ErrorCode.NotFound, _localizer["households.notFound"]));

        tenant.DonationExtrasEnabled = request.DonationExtras;
        _unitOfWork.Tenants.Update(tenant);
        await _unitOfWork.SaveChangesAsync();

        return Result<HouseholdModulesDto>.Success(new HouseholdModulesDto { DonationExtras = tenant.DonationExtrasEnabled });
    }
}
