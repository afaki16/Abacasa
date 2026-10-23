using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Security;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;
using System.Web;

namespace Abacasa.Application.Features.Households.Common;

// Davet işlemlerinin ortak parçaları: token, e-posta, kabul ve kişi bağlama kuralları
public static class HouseholdInvitations
{
    // 32 bayt rastgele token; veritabanına yalnızca SHA-256 hash'i yazılır
    public static (string PlainToken, string TokenHash) NewToken()
    {
        var plainToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        return (plainToken, RefreshTokenHasher.Hash(plainToken));
    }

    public static string HashToken(string plainToken) => RefreshTokenHasher.Hash(plainToken ?? string.Empty);

    public static string NormalizeEmail(string? email) => email?.Trim().ToLowerInvariant() ?? string.Empty;

    public static string RoleLabel(HouseholdRole role) => role == HouseholdRole.Admin ? "Yonetici" : "Uye";

    // Gönderim başarısızsa davet yine geçerlidir; sonuç emailSent olarak döner
    public static async Task<bool> SendAsync(IEmailService emailService, IConfiguration configuration, ILogger logger,
        HouseholdInvitation invitation, string plainToken, string inviterName, string householdName)
    {
        var link = $"{configuration["App:FrontendUrl"]}/auth/accept-invite?token={HttpUtility.UrlEncode(plainToken)}";
        try
        {
            var result = await emailService.SendHouseholdInvitationAsync(
                invitation.Email, inviterName, householdName, RoleLabel(invitation.Role), link);
            return result.IsSuccess;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Davet e-postasi gonderilemedi. InvitationId: {InvitationId}", invitation.Id);
            return false;
        }
    }

    // Daveti kullanıcı adına kabul eder: üyelik (zaten canlı üyeyse dokunulmaz), kişi bağlama, Accepted işareti.
    // Davet hane filtresi dışında yüklenmiştir; değişiklikler davetin hanesi kapsamında yapılır. Transaction çağırana aittir.
    public static async Task AcceptAsync(IUnitOfWork unitOfWork, HouseholdInvitation invitation, User user)
    {
        using (unitOfWork.UseTenant(invitation.TenantId))
        {
            var existing = await unitOfWork.TenantMemberships.GetActiveAsync(user.Id, invitation.TenantId);
            if (existing == null)
            {
                var membership = new TenantMembership { UserId = user.Id, TenantId = invitation.TenantId, Role = invitation.Role };

                // Davetteki kişi (hâlâ varsa ve başka üyeliğe bağlanmadıysa); yoksa kullanıcının adıyla yeni kişi
                Person? person = invitation.PersonId is int personId ? await unitOfWork.People.GetByIdAsync(personId) : null;
                if (person != null && await unitOfWork.TenantMemberships.IsPersonLinkedAsync(person.Id))
                    person = null;
                if (person == null)
                {
                    person = new Person { TenantId = invitation.TenantId, Name = user.FullName };
                    await unitOfWork.People.AddAsync(person);
                }

                membership.AssignPerson(person);
                await unitOfWork.TenantMemberships.AddAsync(membership);
            }

            invitation.AcceptedAt = DateTime.UtcNow;
            invitation.AcceptedByUserId = user.Id;
            unitOfWork.HouseholdInvitations.Update(invitation);

            await unitOfWork.SaveChangesAsync();
        }
    }

    // Davet ve üye düzenlemedeki kişi kuralı: kişi aktif hanede olmalı (filtreli repository),
    // başka canlı üyeliğe ya da başka bekleyen davete bağlı olmamalı. Hata yoksa null.
    public static async Task<Error?> ValidatePersonAsync(IUnitOfWork unitOfWork, IJsonStringLocalizer localizer,
        int personId, int? excludeMembershipId = null, int? excludeInvitationId = null)
    {
        var person = await unitOfWork.People.GetByIdAsync(personId);
        if (person == null)
            return Error.Failure(ErrorCode.ValidationFailed, localizer["households.personNotFound"]);

        if (await unitOfWork.TenantMemberships.IsPersonLinkedAsync(personId, excludeMembershipId)
            || await unitOfWork.HouseholdInvitations.IsPersonInPendingInvitationAsync(personId, DateTime.UtcNow, excludeInvitationId))
            return Error.Failure(ErrorCode.ValidationFailed, localizer["households.personInUse"]);

        return null;
    }
}
