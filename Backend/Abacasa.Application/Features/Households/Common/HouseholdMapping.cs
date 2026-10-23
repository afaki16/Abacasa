using Abacasa.Application.Features.Households.Dtos;
using Abacasa.Domain.Entities;

namespace Abacasa.Application.Features.Households.Common;

public static class HouseholdMapping
{
    public static T ToDto<T>(HouseholdInvitation invitation, DateTime utcNow) where T : HouseholdInvitationDto, new() => new()
    {
        Id = invitation.Id,
        Email = invitation.Email,
        Role = invitation.Role.ToString(),
        PersonId = invitation.PersonId,
        PersonName = invitation.Person?.Name,
        Status = invitation.GetStatus(utcNow).ToString(),
        ExpiresAt = invitation.ExpiresAt,
        CreatedDate = invitation.CreatedDate
    };
}
