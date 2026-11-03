using Abacasa.Application.Common.Results;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Abacasa.Application.Features.Auth.Commands.PasswordCodes
{
    /// <summary>"Forgot password" with a 6-digit code instead of a link (signed-out users, mobile apps).</summary>
    public class SendPasswordResetCodeCommand : IRequest<Result>
    {
        public string Email { get; set; } = string.Empty;
        public string? IpAddress { get; set; }
    }

    public class SendPasswordResetCodeCommandHandler : IRequestHandler<SendPasswordResetCodeCommand, Result>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IOtpService _otpService;
        private readonly IEmailService _emailService;
        private readonly ILogger<SendPasswordResetCodeCommandHandler> _logger;

        public SendPasswordResetCodeCommandHandler(
            IUnitOfWork unitOfWork,
            IOtpService otpService,
            IEmailService emailService,
            ILogger<SendPasswordResetCodeCommandHandler> logger)
        {
            _unitOfWork = unitOfWork;
            _otpService = otpService;
            _emailService = emailService;
            _logger = logger;
        }

        public async Task<Result> Handle(SendPasswordResetCodeCommand request, CancellationToken cancellationToken)
        {
            // Kimlik global: e-posta tüm sistemde benzersiz (forgot-password ile aynı arama, tenant çözümlemesi yok).
            // Always "success": the response must not reveal whether the email exists or is in cooldown.
            var normalizedEmail = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;
            var user = await _unitOfWork.Users.GetByEmailAsync(normalizedEmail);
            if (user is null)
            {
                _logger.LogWarning("Password reset code requested for unknown email. IpAddress: {IpAddress}", request.IpAddress);
                return Result.Success();
            }

            var issue = await _otpService.IssueAsync(user, VerificationPurpose.PasswordReset, request.IpAddress, cancellationToken);
            if (!issue.IsSuccess)
            {
                _logger.LogInformation("Password reset code not sent (cooldown). UserId: {UserId}", user.Id);
                return Result.Success();
            }

            await _emailService.SendPasswordCodeAsync(user.Email, user.FirstName, issue.Value.Code, issue.Value.ValidMinutes);
            _logger.LogInformation("Password reset code sent. UserId: {UserId}, IpAddress: {IpAddress}", user.Id, request.IpAddress);
            return Result.Success();
        }
    }
}
