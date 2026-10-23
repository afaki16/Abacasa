using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Households.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Households.Queries.GetHouseholdMembers;

// Aktif hanenin canlı üyeleri
public class GetHouseholdMembersQuery : IRequest<Result<List<HouseholdMemberDto>>>
{
}
