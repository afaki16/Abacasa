using Abacasa.Application.Common.Results;

namespace Abacasa.Application.Interfaces
{
    public interface IEmailService
    {
        Task<Result> SendEmailAsync(string to, string subject, string body);
        Task<Result> SendEmailConfirmationAsync(string email, string confirmationLink);
        Task<Result> SendPasswordResetAsync(string email, string firstName, string resetLink);
        // Hesap daveti (admin'in oluşturduğu kullanıcıya şifre belirleme linki); hane davetinden ayrı
        Task<Result> SendAccountInvitationAsync(string email, string firstName, string invitationLink, int validHours);
        Task<Result> SendEmailChangeVerificationAsync(string newEmail, string firstName, string confirmLink, int validHours);
        Task<Result> SendEmailChangedNoticeAsync(string oldEmail, string firstName, string newEmail);
        /// <summary>Sends a short one-time code for resetting or changing the password.</summary>
        Task<Result> SendPasswordCodeAsync(string email, string firstName, string code, int validMinutes);
        Task<Result> SendWelcomeEmailAsync(string email, string userName);
        Task<Result> SendHouseholdInvitationAsync(string email, string inviterName, string householdName, string roleLabel, string acceptLink);
        Task<Result> SendBruteForceAlertAsync(
            string email,
            string firstName,
            string ipAddress,
            int failureCount,
            int lockoutMinutes);
    }
}
