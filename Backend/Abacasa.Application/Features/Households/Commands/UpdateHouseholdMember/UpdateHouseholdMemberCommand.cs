using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Households.Dtos;
using Abacasa.Domain.Common.Enums;
using MediatR;

namespace Abacasa.Application.Features.Households.Commands.UpdateHouseholdMember;

// Aktif hanedeki bir üyeliğin rolü ve bağlı kişisi
public class UpdateHouseholdMemberCommand : IRequest<Result<HouseholdMemberDto>>
{
    public int MembershipId { get; set; }
    public HouseholdRole Role { get; set; }
    public int? PersonId { get; set; }
}
