using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.Households.Commands.RevokeHouseholdInvitation;

// Bekleyen daveti iptal eder (RevokedAt)
public class RevokeHouseholdInvitationCommand : IRequest<Result<bool>>
{
    public int Id { get; set; }
}
