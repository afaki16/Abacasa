using Abacasa.Application.Common.Results;
using Abacasa.Application.Common.Security;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;
using System.Web;

namespace Abacasa.Application.Features.Auth.Commands.ForgotPassword
{
    public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand, Result>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ForgotPasswordCommandHandler> _logger;

        public ForgotPasswordCommandHandler(
            IUnitOfWork unitOfWork,
            IEmailService emailService,
            IConfiguration configuration,
            ILogger<ForgotPasswordCommandHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _emailService = emailService;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<Result> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
        {
            var normalizedEmail = request.Email?.Trim().ToLowerInvariant();

            // Kimlik global: e-posta tüm sistemde benzersiz. İstekteki TenantId kabul edilir ama yok sayılır.
            User? targetUser = await _unitOfWork.Users.GetByEmailAsync(normalizedEmail);
            // Returning Success either way avoids leaking whether the email exists.

            if (targetUser is null)
            {
                _logger.LogWarning(
                    "Password reset requested for non-existent email. Email: {Email}, " +
                    "IpAddress: {IpAddress}",
                    normalizedEmail, request.IpAddress);
                return Result.Success();
            }

            // Önceki aktif tokenları geçersiz kıl
            await _unitOfWork.PasswordResetTokens.InvalidatePreviousTokensAsync(targetUser.Id);

            var plainToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
            var hashedToken = RefreshTokenHasher.Hash(plainToken);

            var resetToken = new PasswordResetToken
            {
                UserId = targetUser.Id,
                Token = hashedToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(30),
                RequestIpAddress = request.IpAddress
            };

            await _unitOfWork.PasswordResetTokens.AddAsync(resetToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var frontendUrl = _configuration["App:FrontendUrl"];
            var resetLink = $"{frontendUrl}/auth/reset-password?token={HttpUtility.UrlEncode(plainToken)}&email={HttpUtility.UrlEncode(targetUser.Email)}";

            await _emailService.SendPasswordResetAsync(targetUser.Email, targetUser.FirstName, resetLink);

            _logger.LogInformation(
                "Password reset requested. Email: {Email}, IpAddress: {IpAddress}",
                normalizedEmail, request.IpAddress);

            return Result.Success();
        }
    }
}
