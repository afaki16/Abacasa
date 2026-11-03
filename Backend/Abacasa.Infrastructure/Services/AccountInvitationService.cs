using Abacasa.Application.Common.Results;
using Abacasa.Application.Common.Security;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;
using System.Web;

namespace Abacasa.Infrastructure.Services
{
    /// <summary>
    /// Hesap daveti (şifre belirleme linki). Hane davetinden ayrıdır.
    /// </summary>
    public class AccountInvitationService : IAccountInvitationService
    {
        // Invitations are often opened later than a self-requested reset link, so they live longer.
        private const int InvitationValidHours = 72;

        private readonly IUnitOfWork _unitOfWork;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;
        private readonly ICurrentUserService _currentUserService;
        private readonly ILogger<AccountInvitationService> _logger;

        public AccountInvitationService(
            IUnitOfWork unitOfWork,
            IEmailService emailService,
            IConfiguration configuration,
            ICurrentUserService currentUserService,
            ILogger<AccountInvitationService> logger)
        {
            _unitOfWork = unitOfWork;
            _emailService = emailService;
            _configuration = configuration;
            _currentUserService = currentUserService;
            _logger = logger;
        }

        public async Task<Result> SendAsync(User user, CancellationToken cancellationToken = default)
        {
            await _unitOfWork.PasswordResetTokens.InvalidatePreviousTokensAsync(user.Id);

            // Same token format as forgot-password, so the reset-password endpoint accepts it.
            var plainToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));

            await _unitOfWork.PasswordResetTokens.AddAsync(new PasswordResetToken
            {
                UserId = user.Id,
                Token = RefreshTokenHasher.Hash(plainToken),
                ExpiresAt = DateTime.UtcNow.AddHours(InvitationValidHours)
            });
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var frontendUrl = _configuration["App:FrontendUrl"];
            var invitationLink = $"{frontendUrl}/auth/reset-password?token={HttpUtility.UrlEncode(plainToken)}&email={HttpUtility.UrlEncode(user.Email)}&invite=1";

            var sendResult = await _emailService.SendAccountInvitationAsync(user.Email, user.FirstName, invitationLink, InvitationValidHours);
            if (!sendResult.IsSuccess)
            {
                _logger.LogWarning("Account invitation email could not be sent. UserId: {UserId}", user.Id);
                return sendResult;
            }

            _logger.LogInformation(
                "Account invitation sent. UserId: {UserId}, InvitedBy: {AdminId}",
                user.Id, _currentUserService.UserId);
            return Result.Success();
        }
    }
}
