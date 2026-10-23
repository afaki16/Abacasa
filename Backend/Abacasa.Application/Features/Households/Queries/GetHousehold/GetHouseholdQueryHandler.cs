using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Households.Dtos;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Households.Queries.GetHousehold;

public class GetHouseholdQueryHandler : IRequestHandler<GetHouseholdQuery, Result<HouseholdDetailDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IJsonStringLocalizer _localizer;

    public GetHouseholdQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _localizer = localizer;
    }

    public async Task<Result<HouseholdDetailDto>> Handle(GetHouseholdQuery request, CancellationToken cancellationToken)
    {
        var tenant = _currentUserService.TenantId is int tenantId ? await _unitOfWork.Tenants.GetByIdAsync(tenantId) : null;
        if (tenant == null)
            return Result<HouseholdDetailDto>.Failure(Error.Failure(ErrorCode.NotFound, _localizer["households.notFound"]));

        return Result<HouseholdDetailDto>.Success(new HouseholdDetailDto
        {
            Id = tenant.Id,
            Name = tenant.Name,
            CreatedDate = tenant.CreatedDate,
            MemberCount = await _unitOfWork.TenantMemberships.CountByTenantAsync(tenant.Id)
        });
    }
}
