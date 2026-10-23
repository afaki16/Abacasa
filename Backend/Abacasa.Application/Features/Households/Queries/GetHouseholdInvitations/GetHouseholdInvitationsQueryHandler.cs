using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Households.Common;
using Abacasa.Application.Features.Households.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using MediatR;

namespace Abacasa.Application.Features.Households.Queries.GetHouseholdInvitations;

public class GetHouseholdInvitationsQueryHandler : IRequestHandler<GetHouseholdInvitationsQuery, Result<List<HouseholdInvitationDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetHouseholdInvitationsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<List<HouseholdInvitationDto>>> Handle(GetHouseholdInvitationsQuery request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var invitations = await _unitOfWork.HouseholdInvitations.GetListReadOnlyAsync();

        return Result<List<HouseholdInvitationDto>>.Success(invitations
            .OrderBy(i => i.GetStatus(now) == HouseholdInvitationStatus.Pending ? 0 : 1)
            .ThenByDescending(i => i.CreatedDate)
            .Select(i => HouseholdMapping.ToDto<HouseholdInvitationDto>(i, now))
            .ToList());
    }
}
