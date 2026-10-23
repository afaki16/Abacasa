using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Households.Dtos;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Households.Commands.UpdateHousehold;

public class UpdateHouseholdCommandHandler : IRequestHandler<UpdateHouseholdCommand, Result<HouseholdDetailDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IJsonStringLocalizer _localizer;

    public UpdateHouseholdCommandHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _localizer = localizer;
    }

    public async Task<Result<HouseholdDetailDto>> Handle(UpdateHouseholdCommand request, CancellationToken cancellationToken)
    {
        var tenant = _currentUserService.TenantId is int tenantId ? await _unitOfWork.Tenants.GetByIdAsync(tenantId) : null;
        if (tenant == null)
            return Result<HouseholdDetailDto>.Failure(Error.Failure(ErrorCode.NotFound, _localizer["households.notFound"]));

        tenant.Name = request.Name.Trim();
        _unitOfWork.Tenants.Update(tenant);
        await _unitOfWork.SaveChangesAsync();

        return Result<HouseholdDetailDto>.Success(new HouseholdDetailDto
        {
            Id = tenant.Id,
            Name = tenant.Name,
            CreatedDate = tenant.CreatedDate,
            MemberCount = await _unitOfWork.TenantMemberships.CountByTenantAsync(tenant.Id)
        });
    }
}
