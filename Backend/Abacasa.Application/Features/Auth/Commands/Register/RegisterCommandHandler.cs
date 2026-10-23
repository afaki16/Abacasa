using Abacasa.Application.Common;
using Abacasa.Application.Features.Households.Common;
using Abacasa.Application.Features.Auth.Common;
using Abacasa.Application.Interfaces;
using AutoMapper;
using Abacasa.Application.Features.Auth.Commands.Login;
using Abacasa.Application.Features.Auth.Commands.Logout;
using Abacasa.Application.Features.Auth.Commands.LogoutAll;
using Abacasa.Application.Features.Auth.Commands.LogoutDevice;
using Abacasa.Application.Features.Auth.Commands.Register;
using Abacasa.Application.Features.Auth.Commands.RefreshToken;
using Abacasa.Application.Features.Auth.Commands.ChangePassword;
using Abacasa.Application.Features.Auth.Commands.ForgotPassword;
using Abacasa.Application.Features.Auth.Commands.ResetPassword;
using Abacasa.Application.Common.Security;
using Abacasa.Application.Common.Localization;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Constants;
using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Application.Common.Results;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Models;
using Abacasa.Application.Features.Users.Dtos;
using Abacasa.Application.Features.Roles.Dtos;
using Abacasa.Application.Features.Tenants.Dtos;
using Abacasa.Application.Features.Permissions.Dtos;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;
using System.Threading;
using System.Threading.Tasks;
using System.Web;

namespace Abacasa.Application.Features.Auth.Commands.Register
{
    public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<UserDto>>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPasswordService _passwordService;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;
        private readonly IMapper _mapper;
        private readonly ILogger<RegisterCommandHandler> _logger;
        private readonly IJsonStringLocalizer _localizer;
        private readonly ILegalVersions _legalVersions;

        public RegisterCommandHandler(
            IUnitOfWork unitOfWork,
            IPasswordService passwordService,
            IEmailService emailService,
            IConfiguration configuration,
            IMapper mapper,
            ILogger<RegisterCommandHandler> logger,
            IJsonStringLocalizer localizer,
            ILegalVersions legalVersions)
        {
            _legalVersions = legalVersions;
            _unitOfWork = unitOfWork;
            _passwordService = passwordService;
            _emailService = emailService;
            _configuration = configuration;
            _mapper = mapper;
            _logger = logger;
            _localizer = localizer;
        }

        public async Task<Result<UserDto>> Handle(RegisterCommand request, CancellationToken cancellationToken)
        {
            var normalizedEmail = request.Email?.Trim().ToLowerInvariant();

            // Davetli kayıt: davet geçerli (Pending) olmalı ve e-postası istekteki e-postayla aynı olmalı
            HouseholdInvitation? invitation = null;
            if (!string.IsNullOrWhiteSpace(request.InviteToken))
            {
                invitation = await _unitOfWork.HouseholdInvitations.GetByTokenHashAsync(HouseholdInvitations.HashToken(request.InviteToken));
                if (invitation == null
                    || invitation.GetStatus(DateTime.UtcNow) != HouseholdInvitationStatus.Pending
                    || invitation.Email != normalizedEmail)
                    return Result<UserDto>.Failure(Error.Failure(
                        ErrorCode.ValidationFailed,
                        _localizer["households.invitationInvalid"]));
            }

            // Kimlik global: e-posta tüm sistemde benzersiz
            if (await _unitOfWork.Users.EmailExistsAsync(normalizedEmail))
             return Result<UserDto>.Failure(Error.Failure(
                  ErrorCode.AlreadyExists,
                  _localizer["users.emailExists"]));

            // Telefon da global: normalize edilmiş biçimle kontrol edilir ve saklanır
            var normalizedPhone = PhoneNumberNormalizer.Normalize(request.PhoneNumber);
            if (normalizedPhone != null &&
                await _unitOfWork.Users.PhoneExistsAsync(normalizedPhone))
                return Result<UserDto>.Failure(Error.Failure(
                    ErrorCode.AlreadyExists,
                    _localizer["users.phoneExists"]));

            // Validate password strength (single source of truth: PasswordService)
            var strengthResult = _passwordService.ValidatePasswordStrength(request.Password);
            if (!strengthResult.IsSuccess)
                return Result<UserDto>.Failure(strengthResult.Errors);

        // Hash password
        var passwordResult = _passwordService.HashPassword(request.Password);
            if (!passwordResult.IsSuccess)
            return Result<UserDto>.Failure(Error.Failure(
            ErrorCode.AlreadyExists,
            $"{passwordResult.Error}"));

        // Create user
        var user = new User
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = normalizedEmail,
                PasswordHash = passwordResult.Value,
                PhoneNumber = normalizedPhone,
                // Davetle kayıt e-postayı doğrulanmış sayar ve hane açmaz; davetsiz kayıtta hane doğrulamada açılır
                Status = invitation != null ? UserStatus.Active : UserStatus.PendingVerification,
                EmailConfirmed = invitation != null,
                TenantId = invitation?.TenantId,
                PendingHouseholdName = invitation == null ? request.HouseholdName?.Trim() : null
            };

            // Sistem rolü atanmaz: hane yetkisi üyelikten gelir (11a)

            if (invitation != null)
            {
                // Kullanıcı ve davet kabulü (üyelik, kişi, Accepted) tek transaction'da; doğrulama e-postası gönderilmez
                await _unitOfWork.ExecuteInTransactionAsync(async () =>
                {
                    await _unitOfWork.Users.AddAsync(user);
                    await _unitOfWork.SaveChangesAsync();
                    await LegalConsents.AddAsync(_unitOfWork, _legalVersions, user.Id, LegalConsents.AllDocuments);
                    await HouseholdInvitations.AcceptAsync(_unitOfWork, invitation, user);
                });

                _logger.LogInformation(
                    "User registered by invitation. UserId: {UserId}, Email: {Email}, TenantId: {TenantId}",
                    user.Id, normalizedEmail, user.TenantId);

                return Result<UserDto>.Success(_mapper.Map<UserDto>(user));
            }

            // Kullanıcı ve koşul/aydınlatma onayları tek transaction'da
            await _unitOfWork.ExecuteInTransactionAsync(async () =>
            {
                await _unitOfWork.Users.AddAsync(user);
                await _unitOfWork.SaveChangesAsync();
                await LegalConsents.AddAsync(_unitOfWork, _legalVersions, user.Id, LegalConsents.AllDocuments);
                await _unitOfWork.SaveChangesAsync();
            });

            _logger.LogInformation(
                "User registered. UserId: {UserId}, Email: {Email}, TenantId: {TenantId}",
                user.Id, normalizedEmail, user.TenantId);

            await IssueVerificationEmailAsync(user, request.IpAddress, cancellationToken);

            var userDto = _mapper.Map<UserDto>(user);
            return Result<UserDto>.Success(userDto);
        }

        private async Task IssueVerificationEmailAsync(User user, string ipAddress, CancellationToken cancellationToken)
        {
            var plainToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
            var hashedToken = RefreshTokenHasher.Hash(plainToken);

            var verificationToken = new UserVerificationToken
            {
                UserId = user.Id,
                Token = hashedToken,
                Channel = VerificationChannel.Email,
                Purpose = VerificationPurpose.Registration,
                Destination = user.Email,
                ExpiresAt = DateTime.UtcNow.AddHours(2),
                RequestIpAddress = ipAddress
            };

            await _unitOfWork.UserVerificationTokens.AddAsync(verificationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var frontendUrl = _configuration["App:FrontendUrl"];
            var verifyLink = $"{frontendUrl}/auth/verify-email?token={HttpUtility.UrlEncode(plainToken)}&email={HttpUtility.UrlEncode(user.Email)}";

            try
            {
                var sendResult = await _emailService.SendEmailConfirmationAsync(user.Email, verifyLink);
                if (!sendResult.IsSuccess)
                {
                    _logger.LogError(
                        "Failed to send verification email after register. UserId: {UserId}, Email: {Email}",
                        user.Id, user.Email);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Exception while sending verification email after register. UserId: {UserId}, Email: {Email}",
                    user.Id, user.Email);
            }
        }
    }
} 
