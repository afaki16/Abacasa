using Abacasa.Domain.Common.Enums;

namespace Abacasa.Application.Features.Households.Dtos;

// Aktif hane bilgisi
public class HouseholdDetailDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedDate { get; set; }
    public int MemberCount { get; set; }
}

public class UpdateHouseholdDto
{
    public string Name { get; set; } = string.Empty;
}

// Hane silme onayı: giriş yapan kullanıcının parolası ve hane adının aynısı
public class DeleteHouseholdDto
{
    public string Password { get; set; } = string.Empty;
    public string ConfirmName { get; set; } = string.Empty;
}

public class HouseholdMemberDto
{
    public int MembershipId { get; set; }
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    // "Admin" / "Member"
    public string Role { get; set; } = string.Empty;
    public int? PersonId { get; set; }
    public string? PersonName { get; set; }
    public DateTime JoinedAt { get; set; }
    public bool IsCurrentUser { get; set; }
}

public class UpdateHouseholdMemberDto
{
    public HouseholdRole Role { get; set; }
    // Boşsa üyelikten kişi bağı kaldırılır
    public int? PersonId { get; set; }
}

public class HouseholdInvitationDto
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int? PersonId { get; set; }
    public string? PersonName { get; set; }
    // "Pending" / "Accepted" / "Revoked" / "Expired"
    public string Status { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedDate { get; set; }
}

// Davet oluşturma ve yeniden gönderme sonucu; e-posta gitmese de davet geçerlidir
public class HouseholdInvitationSendResultDto : HouseholdInvitationDto
{
    public bool EmailSent { get; set; }
}

public class CreateHouseholdInvitationDto
{
    public string Email { get; set; } = string.Empty;
    public HouseholdRole Role { get; set; } = HouseholdRole.Member;
    public int? PersonId { get; set; }
}

// Token sahibine gösterilen davet özeti
public class InvitationInfoDto
{
    public string HouseholdName { get; set; } = string.Empty;
    public string InviterName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool UserExists { get; set; }
}

public class AcceptInvitationDto
{
    public string Token { get; set; } = string.Empty;
}

public class AcceptInvitationResultDto
{
    public int TenantId { get; set; }
}
