using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using System;

namespace Abacasa.Domain.Entities;

// Haneye e-posta daveti. Tek kullanımlık; token'ın yalnızca SHA-256 hash'i saklanır.
// Durum saklanmaz: AcceptedAt / RevokedAt / ExpiresAt'ten hesaplanır.
public class HouseholdInvitation : BaseAuditableEntity, ITenantScoped
{
    // Davetin geçerlilik süresi (tek kaynak)
    public static readonly TimeSpan Validity = TimeSpan.FromDays(7);

    public int TenantId { get; set; }

    // Normalize edilmiş (trim + küçük harf)
    public string Email { get; set; }
    public HouseholdRole Role { get; set; }

    // Kabulde üyeliğe bağlanacak kişi (aynı hanenin)
    public int? PersonId { get; set; }
    public Person? Person { get; set; }

    public string TokenHash { get; set; }
    public DateTime ExpiresAt { get; set; }

    public int InvitedByUserId { get; set; }
    public User InvitedByUser { get; set; }

    public DateTime? AcceptedAt { get; set; }
    public int? AcceptedByUserId { get; set; }
    public DateTime? RevokedAt { get; set; }

    public HouseholdInvitationStatus GetStatus(DateTime utcNow)
    {
        if (AcceptedAt.HasValue) return HouseholdInvitationStatus.Accepted;
        if (RevokedAt.HasValue) return HouseholdInvitationStatus.Revoked;
        return ExpiresAt <= utcNow ? HouseholdInvitationStatus.Expired : HouseholdInvitationStatus.Pending;
    }
}
