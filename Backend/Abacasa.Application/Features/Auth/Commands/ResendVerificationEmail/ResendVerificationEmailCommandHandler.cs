using Abacasa.Application.Common.Results;
using Abacasa.Application.Common.Security;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;
using System.Web;

namespace Abacasa.Application.Features.Auth.Commands.ResendVerificationEmail
{
    public class ResendVerificationEmailCommandHandler : IRequestHandler<ResendVerificationEmailCommand, Result>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ResendVerificationEmailCommandHandler> _logger;

        public ResendVerificationEmailCommandHandler(
            IUnitOfWork unitOfWork,
            IEmailService emailService,
            IConfiguration configuration,
            ILogger<ResendVerificationEmailCommandHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _emailService = emailService;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<Result> Handle(ResendVerificationEmailCommand request, CancellationToken cancellationToken)
        {
            var normalizedEmail = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;

            // Kimlik global: e-posta tüm sistemde benzersiz. İstekteki TenantId kabul edilir ama yok sayılır.
            User? targetUser = await _unitOfWork.Users.GetByEmailAsync(normalizedEmail);

            // Email enumeration protection: return Success regardless of whether the user
            // exists or is already verified.
            if (targetUser is null)
            {
                _logger.LogWarning(
                    "Resend verification requested for non-existent email. Email: {Email}, IpAddress: {IpAddress}",
                    normalizedEmail, request.IpAddress);
                return Result.Success();
            }

            if (targetUser.EmailConfirmed)
            {
                _logger.LogInformation(
                    "Resend verification requested for already-verified email. UserId: {UserId}, Email: {Email}, IpAddress: {IpAddress}",
                    targetUser.Id, normalizedEmail, request.IpAddress);
                return Result.Success();
            }

            await _unitOfWork.UserVerificationTokens.InvalidatePreviousTokensAsync(
                targetUser.Id,
                VerificationChannel.Email,
                VerificationPurpose.Registration);

            var plainToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
            var hashedToken = RefreshTokenHasher.Hash(plainToken);

            var verificationToken = new UserVerificationToken
            {
                UserId = targetUser.Id,
                Token = hashedToken,
                Channel = VerificationChannel.Email,
                Purpose = VerificationPurpose.Registration,
                Destination = targetUser.Email,
                ExpiresAt = DateTime.UtcNow.AddHours(2),
                RequestIpAddress = request.IpAddress
            };

            await _unitOfWork.UserVerificationTokens.AddAsync(verificationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var frontendUrl = _configuration["App:FrontendUrl"];
            var verifyLink = $"{frontendUrl}/auth/verify-email?token={HttpUtility.UrlEncode(plainToken)}&email={HttpUtility.UrlEncode(targetUser.Email)}";

            await _emailService.SendEmailConfirmationAsync(targetUser.Email, verifyLink);

            _logger.LogInformation(
                "Verification email resent. UserId: {UserId}, Email: {Email}, IpAddress: {IpAddress}",
                targetUser.Id, normalizedEmail, request.IpAddress);

            return Result.Success();
        }
    }
}
