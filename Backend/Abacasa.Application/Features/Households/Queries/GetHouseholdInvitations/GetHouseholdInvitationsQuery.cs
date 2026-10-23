using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Households.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Households.Queries.GetHouseholdInvitations;

// Aktif hanenin davetleri: bekleyenler önce, sonra en yeni
public class GetHouseholdInvitationsQuery : IRequest<Result<List<HouseholdInvitationDto>>>
{
}
