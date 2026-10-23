using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Common.Security;
using Abacasa.Application.Features.Households.Common;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Abacasa.Application.Features.Auth.Commands.VerifyEmail
{
    public class VerifyEmailCommandHandler : IRequestHandler<VerifyEmailCommand, Result>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<VerifyEmailCommandHandler> _logger;
        private readonly IJsonStringLocalizer _localizer;

        public VerifyEmailCommandHandler(
            IUnitOfWork unitOfWork,
            ILogger<VerifyEmailCommandHandler> logger,
            IJsonStringLocalizer localizer)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
            _localizer = localizer;
        }

        public async Task<Result> Handle(VerifyEmailCommand request, CancellationToken cancellationToken)
        {
            var normalizedEmail = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;
            var hashedToken = RefreshTokenHasher.Hash(request.Token);

            var token = await _unitOfWork.UserVerificationTokens.GetValidTokenAsync(
                hashedToken,
                normalizedEmail,
                VerificationChannel.Email,
                VerificationPurpose.Registration);

            if (token is null)
            {
                _logger.LogWarning(
                    "Email verification failed - invalid or expired token. Email: {Email}, IpAddress: {IpAddress}",
                    normalizedEmail, request.IpAddress);
                return Result.Failure(Error.Failure(
                    ErrorCode.ValidationFailed,
                    _localizer["auth.invalidOrExpiredVerificationLink"]));
            }

            // Doğrulama ve (kayıtta istenen) hanenin açılışı tek transaction'da
            await _unitOfWork.ExecuteInTransactionAsync(async () =>
            {
                var user = token.User;
                user.EmailConfirmed = true;
                // Only activate accounts waiting for verification; never re-activate a deactivated or banned user
                if (user.Status == UserStatus.PendingVerification)
                    user.Status = UserStatus.Active;
                token.MarkAsUsed();

                // Kayıtta istenen hane: 11a'daki hane açılışıyla aynı kod (yönetici üyeliği, "Kendisi" kişisi, kategoriler)
                if (!string.IsNullOrWhiteSpace(user.PendingHouseholdName))
                {
                    var tenant = await HouseholdSetup.CreateAsync(_unitOfWork, user, user.PendingHouseholdName);
                    user.TenantId = tenant.Id;
                    user.PendingHouseholdName = null;
                }

                _unitOfWork.Users.Update(user);
                _unitOfWork.UserVerificationTokens.Update(token);

                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }, cancellationToken);

            _logger.LogInformation(
                "Email verified. UserId: {UserId}, Email: {Email}, IpAddress: {IpAddress}",
                token.User.Id, token.User.Email, request.IpAddress);

            return Result.Success();
        }
    }
}
