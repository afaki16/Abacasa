using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Common.Security;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Abacasa.Application.Features.Auth.Commands.ConfirmEmailChange
{
    public class ConfirmEmailChangeCommandHandler : IRequestHandler<ConfirmEmailChangeCommand, Result>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IEmailService _emailService;
        private readonly ILogger<ConfirmEmailChangeCommandHandler> _logger;
        private readonly IJsonStringLocalizer _localizer;

        public ConfirmEmailChangeCommandHandler(
            IUnitOfWork unitOfWork,
            IEmailService emailService,
            ILogger<ConfirmEmailChangeCommandHandler> logger,
            IJsonStringLocalizer localizer)
        {
            _unitOfWork = unitOfWork;
            _emailService = emailService;
            _logger = logger;
            _localizer = localizer;
        }

        public async Task<Result> Handle(ConfirmEmailChangeCommand request, CancellationToken cancellationToken)
        {
            var newEmail = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;
            var token = await _unitOfWork.UserVerificationTokens.GetValidTokenAsync(
                RefreshTokenHasher.Hash(request.Token ?? string.Empty),
                newEmail,
                VerificationChannel.Email,
                VerificationPurpose.EmailChange);

            if (token?.User is null)
            {
                _logger.LogWarning(
                    "Email change confirmation failed - invalid or expired token. IpAddress: {IpAddress}",
                    request.IpAddress);
                return Result.Failure(Error.Failure(ErrorCode.ValidationFailed, _localizer["auth.invalidOrExpiredVerificationLink"]));
            }

            var user = token.User;

            // The address may have been taken by someone else since the request (identity is global)
            if (await _unitOfWork.Users.EmailExistsAsync(newEmail, user.Id))
                return Result.Failure(Error.Failure(ErrorCode.AlreadyExists, _localizer["users.emailExists"]));

            var oldEmail = user.Email;
            user.Email = newEmail;
            // The link reached the new inbox, so the new address is verified
            user.EmailConfirmed = true;
            // Access/refresh tokens carry the old email; sign out everywhere and sign in again with the new one
            user.LastSessionsRevokedAt = DateTime.UtcNow;
            token.MarkAsUsed();

            _unitOfWork.Users.Update(user);
            _unitOfWork.UserVerificationTokens.Update(token);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Runs immediately (ExecuteUpdate), so only after the email change is saved
            await _unitOfWork.RefreshTokens.RevokeAllUserTokensAsync(user.Id, reason: "Email changed");

            // Tell the previous owner of the inbox; if this was not them, they now know the account moved
            await _emailService.SendEmailChangedNoticeAsync(oldEmail, user.FirstName, newEmail);

            _logger.LogInformation(
                "Email changed. UserId: {UserId}, IpAddress: {IpAddress}",
                user.Id, request.IpAddress);
            return Result.Success();
        }
    }
}
