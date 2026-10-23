using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Households.Dtos;
using Abacasa.Domain.Common.Enums;
using MediatR;

namespace Abacasa.Application.Features.Households.Commands.CreateHouseholdInvitation;

// Aktif haneye e-posta daveti
public class CreateHouseholdInvitationCommand : IRequest<Result<HouseholdInvitationSendResultDto>>
{
    public string Email { get; set; } = string.Empty;
    public HouseholdRole Role { get; set; }
    public int? PersonId { get; set; }
}
