using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.Households.Commands.RemoveHouseholdMember;

// Aktif haneden bir üyeyi çıkarır (kendini çıkarmak için LeaveHousehold)
public class RemoveHouseholdMemberCommand : IRequest<Result<bool>>
{
    public int MembershipId { get; set; }
}
