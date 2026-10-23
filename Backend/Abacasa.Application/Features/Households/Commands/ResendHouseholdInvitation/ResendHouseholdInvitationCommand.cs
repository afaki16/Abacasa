using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Households.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Households.Commands.ResendHouseholdInvitation;

// Bekleyen ya da süresi dolmuş davete yeni token ve süre; eski token geçersiz olur
public class ResendHouseholdInvitationCommand : IRequest<Result<HouseholdInvitationSendResultDto>>
{
    public int Id { get; set; }
}
