using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Households.Dtos;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Households.Queries.GetHouseholdMembers;

public class GetHouseholdMembersQueryHandler : IRequestHandler<GetHouseholdMembersQuery, Result<List<HouseholdMemberDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IJsonStringLocalizer _localizer;

    public GetHouseholdMembersQueryHandler(IUnitOfWork unitOfWork, ICurrentUserService currentUserService, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _localizer = localizer;
    }

    public async Task<Result<List<HouseholdMemberDto>>> Handle(GetHouseholdMembersQuery request, CancellationToken cancellationToken)
    {
        if (_currentUserService.TenantId is not int tenantId)
            return Result<List<HouseholdMemberDto>>.Failure(Error.Failure(ErrorCode.NotFound, _localizer["households.notFound"]));

        var members = await _unitOfWork.TenantMemberships.GetByTenantReadOnlyAsync(tenantId);

        return Result<List<HouseholdMemberDto>>.Success(members.Select(m => new HouseholdMemberDto
        {
            MembershipId = m.Id,
            UserId = m.UserId,
            FullName = m.User.FullName,
            Email = m.User.Email,
            Role = m.Role.ToString(),
            PersonId = m.PersonId,
            PersonName = m.Person?.Name,
            JoinedAt = m.CreatedDate,
            IsCurrentUser = m.UserId == _currentUserService.UserId
        }).ToList());
    }
}
