using Abacasa.Application.Interfaces;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Features.Auth.Dtos;
using Abacasa.Application.Features.Auth.Models;
using Abacasa.Application.Common.Security;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Application.Common.Results;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using Abacasa.Domain.Common.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace Abacasa.Infrastructure.Services
{
    public class JwtService : IAuthService
    {
        private readonly IConfiguration _configuration;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPasswordService _passwordService;
        private readonly ILogger<JwtService> _logger;
        private readonly IBruteForceProtectionService _bruteForceService;
        private readonly IEmailService _emailService;
        private readonly IJsonStringLocalizer _localizer;
        private readonly IPermissionService _permissionService;
        private readonly ILegalVersions _legalVersions;

        // A rotated token presented again within this window is treated as a benign race
        // (parallel tabs/requests), not as theft.
        private static readonly TimeSpan ReuseDetectionGracePeriod = TimeSpan.FromSeconds(30);

        public JwtService(
            IConfiguration configuration,
            IUnitOfWork unitOfWork,
            IPasswordService passwordService,
            ILogger<JwtService> logger,
            IBruteForceProtectionService bruteForceService,
            IEmailService emailService,
            IJsonStringLocalizer localizer,
            IPermissionService permissionService,
            ILegalVersions legalVersions)
        {
            _legalVersions = legalVersions;
            _configuration = configuration;
            _unitOfWork = unitOfWork;
            _passwordService = passwordService;
            _logger = logger;
            _bruteForceService = bruteForceService;
            _emailService = emailService;
            _localizer = localizer ?? throw new ArgumentNullException(nameof(localizer));
            _permissionService = permissionService;
        }

    /// <summary>
    /// Oturumun aktif hanesini seçer: tercih edilen hanede (User.TenantId ya da oturumun hanesi) canlı üyelik ve
    /// aktif hane varsa o; yoksa en eski canlı üyeliğin aktif hanesi; o da yoksa null. Pasif ya da silinmiş hane atlanır.
    /// </summary>
    private async Task<int?> SelectActiveTenantAsync(int userId, int? preferredTenantId)
    {
        var usable = (await _unitOfWork.TenantMemberships.GetByUserReadOnlyAsync(userId))
            .Where(m => m.Tenant != null && m.Tenant.IsActive)
            .ToList();

        if (preferredTenantId.HasValue && usable.Any(m => m.TenantId == preferredTenantId.Value))
            return preferredTenantId;

        return usable.FirstOrDefault()?.TenantId;
    }

    // tenantId: kimlik global olduğu için yok sayılır (geriye uyumluluk için imzada kalır)
    public async Task<Result<LoginResponseDto>> LoginAsync(string email, string password, string ipAddress, string userAgent, string deviceId = null, string deviceName = null, bool rememberMe = false, int? tenantId = null)
    {
        var normalizedEmail = email?.Trim().ToLowerInvariant() ?? string.Empty;
        var safeIp = ipAddress ?? string.Empty;

        try
        {
            var lockoutStatus = await _bruteForceService.CheckLockoutAsync(normalizedEmail, safeIp);
            if (lockoutStatus.IsLockedOut)
            {
                // Run dummy verify so locked-out path takes the same time as a real verify.
                _passwordService.VerifyPassword(password, SecurityConstants.DummyBCryptHash);

                await _bruteForceService.RecordFailedAttemptAsync(
                    normalizedEmail, safeIp, userAgent, LoginFailureReasons.AccountLocked);

                return Result<LoginResponseDto>.Failure(Error.Failure(
                    ErrorCode.Unauthorized,
                    _localizer["auth.invalidCredentials"]));
            }

            // Kimlik global: e-posta tüm sistemde benzersiz, kullanıcı tek kayıt olarak bulunur
            var user = await _unitOfWork.Users.GetByEmailWithRolesAsync(normalizedEmail);

            if (user == null)
            {
                // User-not-found path runs the same BCrypt cost so an attacker cannot
                // distinguish missing accounts from real ones via response time.
                _passwordService.VerifyPassword(password, SecurityConstants.DummyBCryptHash);

                await RecordFailureAndNotifyAsync(normalizedEmail, safeIp, userAgent, LoginFailureReasons.UserNotFound, null);

                return Result<LoginResponseDto>.Failure(Error.Failure(
                    ErrorCode.Unauthorized,
                    _localizer["auth.invalidCredentials"]));
            }

            var passwordVerification = _passwordService.VerifyPassword(password, user.PasswordHash);
            if (!passwordVerification.IsSuccess || !passwordVerification.Value)
            {
                await RecordFailureAndNotifyAsync(normalizedEmail, safeIp, userAgent, LoginFailureReasons.InvalidPassword, user);
                return Result<LoginResponseDto>.Failure(Error.Failure(
                    ErrorCode.Unauthorized,
                    _localizer["auth.invalidCredentials"]));
            }

            // Parolası doğru ama e-postası doğrulanmamış (kayıt sonrası bekleyen) kullanıcı:
            // genel hata yerine Active ama doğrulanmamış kullanıcıdakiyle aynı kod
            if (user.Status == Domain.Common.Enums.UserStatus.PendingVerification)
            {
                await _bruteForceService.RecordFailedAttemptAsync(
                    normalizedEmail, safeIp, userAgent, LoginFailureReasons.EmailNotConfirmed);

                return Result<LoginResponseDto>.Failure(Error.Failure(
                    ErrorCode.EmailNotConfirmed,
                    _localizer["auth.emailNotConfirmed"]));
            }

            if (user.Status != Domain.Common.Enums.UserStatus.Active)
            {
                await _bruteForceService.RecordFailedAttemptAsync(
                    normalizedEmail, safeIp, userAgent, LoginFailureReasons.AccountInactive);

                _logger.LogWarning(
                    "Login attempt on inactive account. Email: {Email}, Status: {Status}, IP: {IpAddress}",
                    normalizedEmail, user.Status, safeIp);

                // Generic response — do not leak account-status info to the caller.
                // No email notification: the legitimate owner already knows the account is inactive.
                return Result<LoginResponseDto>.Failure(Error.Failure(
                    ErrorCode.Unauthorized,
                    _localizer["auth.invalidCredentials"]));
            }

            if (!user.EmailConfirmed)
            {
                await _bruteForceService.RecordFailedAttemptAsync(
                    normalizedEmail, safeIp, userAgent, LoginFailureReasons.EmailNotConfirmed);

                _logger.LogWarning(
                    "Login attempt on unconfirmed email. Email: {Email}, IpAddress: {IpAddress}",
                    normalizedEmail, safeIp);

                return Result<LoginResponseDto>.Failure(Error.Failure(
                    ErrorCode.EmailNotConfirmed,
                    _localizer["auth.emailNotConfirmed"]));
            }

            // Aktif hane: son aktif hane (User.TenantId) canlıysa o, yoksa en eski canlı üyelik, o da yoksa null.
            // Pasif hane seçimde atlanır; hanesiz kullanıcı da giriş yapabilir.
            var activeTenantId = await SelectActiveTenantAsync(user.Id, user.TenantId);

            var accessTokenResult = await GenerateAccessTokenAsync(user, activeTenantId);
            if (!accessTokenResult.IsSuccess)
                return Result<LoginResponseDto>.Failure(Error.Failure(
                    ErrorCode.InternalError,
                    _localizer["auth.accessTokenGenerationFailed"]));

            var refreshTokenResult = await GenerateRefreshTokenAsync(user, ipAddress, userAgent, deviceId, deviceName, rememberMe, tenantId: activeTenantId);
            if (!refreshTokenResult.IsSuccess)
                return Result<LoginResponseDto>.Failure(Error.Failure(
                    ErrorCode.InternalError,
                    _localizer["auth.refreshTokenGenerationFailed"]));

            await _bruteForceService.RecordSuccessfulAttemptAsync(normalizedEmail, safeIp, userAgent);

            user.LastLoginDate = DateTime.UtcNow;
            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation(
                "Login successful. UserId: {UserId}, Email: {Email}, " +
                "IpAddress: {IpAddress}, DeviceId: {DeviceId}",
                user.Id, normalizedEmail, safeIp, deviceId ?? "unknown");

            return Result<LoginResponseDto>.Success(
                await BuildLoginResponseAsync(user, activeTenantId, accessTokenResult.Value, refreshTokenResult.Value));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Login failed for email {Email}", normalizedEmail);
            return Result<LoginResponseDto>.Failure(Error.Failure(
                ErrorCode.InternalError,
                _localizer["auth.loginUnexpectedError"]));
        }
    }

    private async Task RecordFailureAndNotifyAsync(
        string email,
        string ipAddress,
        string userAgent,
        string failureReason,
        User user)
    {
        await _bruteForceService.RecordFailedAttemptAsync(email, ipAddress, userAgent, failureReason);

        if (user == null)
            return;

        var statusAfter = await _bruteForceService.CheckLockoutAsync(email, ipAddress);
        if (!_bruteForceService.IsAtTierThreshold(statusAfter.FailureCount))
            return;

        try
        {
            await _emailService.SendBruteForceAlertAsync(
                user.Email,
                user.FirstName,
                ipAddress,
                statusAfter.FailureCount,
                statusAfter.LockoutMinutes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send brute force alert email to {Email}", email);
        }
    }

  
    // tenantId: oturumun aktif hanesi (tenant_id claim'i); null ise claim eklenmez
    public async Task<Result<string>> GenerateAccessTokenAsync(User user, int? tenantId)
        {
            try
            {
                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Name, user.FullName),
                    new Claim("firstName", user.FirstName),
                    new Claim("lastName", user.LastName),
                    new Claim("status", user.Status.ToString())
                };

                if (tenantId.HasValue)
                {
                    claims.Add(new Claim("tenant_id", tenantId.Value.ToString()));
                }

                // Yalnızca sistem rolleri; hane rolü üyelikten gelir ve token'a girmez
                var roles = user.UserRoles
                    .Select(ur => ur.Role)
                    .Where(r => r != null && !Application.Features.Users.Common.UserProfileBuilder.IsHouseholdRole(r.Name))
                    .ToList();
                foreach (var role in roles)
                {
                    claims.Add(new Claim(ClaimTypes.Role, role.Name));
                }


                var jwtSettings = _configuration.GetSection("JwtSettings");
                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]));
                var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

                var issuedAt = DateTime.UtcNow;
                claims.Add(new Claim(JwtRegisteredClaimNames.Iat, new DateTimeOffset(issuedAt).ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64));

                var token = new JwtSecurityToken(
                    issuer: jwtSettings["Issuer"],
                    audience: jwtSettings["Audience"],
                    claims: claims,
                    notBefore: issuedAt,
                    expires: issuedAt.AddMinutes(int.Parse(jwtSettings["ExpiryInMinutes"])),
                    signingCredentials: credentials
                );

                var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
                return Result<string>.Success(tokenString);
        }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate access token for user {UserId}", user.Id);
                return Result<string>.Failure(Error.Failure(ErrorCode.InternalError, _localizer["auth.accessTokenGenerationFailed"]));
            }
    }

        // tenantId: oturumun aktif hanesi; refresh token kaydına yazılır, rotation'da yeni token'a aynen geçer
        public async Task<Result<RefreshTokenIssueResult>> GenerateRefreshTokenAsync(User user, string ipAddress, string userAgent, string deviceId = null, string deviceName = null, bool rememberMe = false, DateTime? preserveExpiryDate = null, int? tenantId = null)
        {
            try
            {
                // Revoke existing active tokens for the same device if deviceId is provided
                if (!string.IsNullOrEmpty(deviceId))
                {
                    await _unitOfWork.RefreshTokens.RevokeTokensByDeviceAsync(user.Id, deviceId, ipAddress, userAgent, "New login from same device");
                }

                DateTime expiryDate;
                if (preserveExpiryDate.HasValue)
                {
                    expiryDate = preserveExpiryDate.Value;
                }
                else
                {
                    var expiryDays = rememberMe
                        ? int.Parse(_configuration["JwtSettings:RefreshTokenExpiryInDaysRememberMe"] ?? "30")
                        : int.Parse(_configuration["JwtSettings:RefreshTokenExpiryInDays"] ?? "7");
                    expiryDate = DateTime.UtcNow.AddDays(expiryDays);
                }

                var randomBytes = new byte[64];
                using var rng = RandomNumberGenerator.Create();
                rng.GetBytes(randomBytes);

                var plainToken = Convert.ToBase64String(randomBytes);
                var tokenHash = RefreshTokenHasher.Hash(plainToken);

                var refreshToken = new RefreshToken
                {
                    UserId = user.Id,
                    Token = tokenHash,
                    ExpiryDate = expiryDate,
                    IpAddress = ipAddress,
                    UserAgent = userAgent,
                    DeviceId = deviceId,
                    DeviceName = deviceName,
                    DeviceType = GetDeviceType(userAgent),
                    Location = await GetLocationFromIpAsync(ipAddress),
                    TenantId = tenantId
                };

                await _unitOfWork.RefreshTokens.AddAsync(refreshToken);
                await _unitOfWork.SaveChangesAsync();

                return Result<RefreshTokenIssueResult>.Success(new RefreshTokenIssueResult
                {
                    Stored = refreshToken,
                    PlainToken = plainToken
                });
        }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate refresh token for user {UserId}", user.Id);
                return Result<RefreshTokenIssueResult>.Failure(Error.Failure(ErrorCode.InternalError, _localizer["auth.refreshTokenGenerationFailed"]));
            }
    }

        private string GetDeviceType(string userAgent)
        {
            if (string.IsNullOrEmpty(userAgent))
                return "Unknown";

            userAgent = userAgent.ToLower();
            
            if (userAgent.Contains("mobile") || userAgent.Contains("android") || userAgent.Contains("iphone") || userAgent.Contains("ipad"))
                return "Mobile";
            if (userAgent.Contains("tablet"))
                return "Tablet";
            if (userAgent.Contains("desktop") || userAgent.Contains("windows") || userAgent.Contains("mac") || userAgent.Contains("linux"))
                return "Desktop";
            
            return "Unknown";
        }

        private async Task<string> GetLocationFromIpAsync(string ipAddress)
        {
            // TODO: Implement IP geolocation service
            // For now, return a placeholder
            return "Unknown";
        }

    public async Task<Result<LoginResponseDto>> RefreshTokenAsync(string accessToken, string refreshToken, string ipAddress, string userAgent)
    {
        try
        {
            // Yeni akış: UserId'yi refresh token kaydından çıkarıyoruz, access token'a İHTİYAÇ YOK.
            // Eski akış (access token'dan userId çıkarma) backward compatibility için
            // accessToken parametresi hala alınıyor ama artık opsiyonel olarak işleniyor.

            var storedRefreshToken = await _unitOfWork.RefreshTokens.GetByTokenAsync(refreshToken);
            if (storedRefreshToken == null)
                return Result<LoginResponseDto>.Failure(Error.Failure(
                    ErrorCode.InvalidRequest,
                    _localizer["auth.invalidRefreshToken"]));

            var userId = storedRefreshToken.UserId;

            // Eğer accessToken da gönderilmişse, refresh token'ın gerçek sahibiyle uyuşuyor mu kontrol et.
            // (Defense-in-depth: birisi başkasının refresh token'ını kendi access token'ıyla göndermeye çalışırsa yakalanır.)
            if (!string.IsNullOrEmpty(accessToken))
            {
                var principal = GetClaimsFromExpiredToken(accessToken);
                if (principal != null)
                {
                    var tokenUserIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                    if (int.TryParse(tokenUserIdClaim, out var tokenUserId) && tokenUserId != userId)
                    {
                        _logger.LogWarning(
                            "Refresh token / access token user mismatch. Refresh.UserId: {RefreshUserId}, Token.UserId: {TokenUserId}, IP: {IpAddress}",
                            userId, tokenUserId, ipAddress);
                        return Result<LoginResponseDto>.Failure(Error.Failure(
                            ErrorCode.InvalidRequest,
                            _localizer["auth.invalidRefreshToken"]));
                    }
                }
            }

            // Reuse detection: a token that was rotated away more than the grace period ago being
            // presented again indicates the previous holder already moved past it — the real owner
            // is likely an attacker. Revoke everything.
            if (storedRefreshToken.IsRevoked &&
                storedRefreshToken.Reason == RefreshTokenReasons.Rotated &&
                storedRefreshToken.RevokedDate.HasValue &&
                DateTime.UtcNow - storedRefreshToken.RevokedDate.Value > ReuseDetectionGracePeriod)
            {
                _logger.LogWarning(
                    "Refresh token reuse detected for user {UserId}. All sessions revoked. Source IP: {IpAddress}, UserAgent: {UserAgent}",
                    storedRefreshToken.UserId, ipAddress, userAgent);

                await _unitOfWork.RefreshTokens.RevokeAllUserTokensAsync(
                    storedRefreshToken.UserId, ipAddress, userAgent, "Refresh token reuse detected");

                var compromisedUser = await _unitOfWork.Users.GetByIdAsync(storedRefreshToken.UserId);
                if (compromisedUser != null)
                {
                    compromisedUser.LastSessionsRevokedAt = DateTime.UtcNow;
                    _unitOfWork.Users.Update(compromisedUser);
                    await _unitOfWork.SaveChangesAsync();
                }

                return Result<LoginResponseDto>.Failure(Error.Failure(
                    ErrorCode.InvalidRequest,
                    _localizer["auth.invalidRefreshToken"]));
            }

            // Revoked for another reason (logout, session revoke, new login on device...) or rotated
            // within the grace period: reject without touching other sessions.
            if (storedRefreshToken.IsRevoked)
            {
                _logger.LogInformation(
                    "Revoked refresh token presented. UserId: {UserId}, Reason: {Reason}, RevokedDate: {RevokedDate}, IP: {IpAddress}",
                    storedRefreshToken.UserId, storedRefreshToken.Reason, storedRefreshToken.RevokedDate, ipAddress);

                return Result<LoginResponseDto>.Failure(Error.Failure(
                    ErrorCode.InvalidRequest,
                    _localizer["auth.invalidRefreshToken"]));
            }

            if (storedRefreshToken.IsExpired)
                return Result<LoginResponseDto>.Failure(Error.Failure(
                    ErrorCode.InvalidRequest,
                    _localizer["auth.refreshTokenInactive"]));

            var user = await _unitOfWork.Users.GetUserWithRolesReadOnlyAsync(userId);
            if (user == null)
                return Result<LoginResponseDto>.Failure(Error.Failure(
                    ErrorCode.NotFound,
                    _localizer["auth.userNotFound"]));

            // Inactive user: refuse without revoking, so the session can continue if the account is re-activated.
            if (user.Status != Domain.Common.Enums.UserStatus.Active)
                return Result<LoginResponseDto>.Failure(Error.Failure(
                    ErrorCode.InvalidRequest,
                    _localizer["auth.invalidRefreshToken"]));

            // Oturumun hanesi: üyelik hâlâ canlı ve hane aktifse aynı hane; değilse login kuralıyla yeniden seçilir
            int? activeTenantId = null;
            if (storedRefreshToken.TenantId.HasValue)
            {
                var candidate = await SelectActiveTenantAsync(user.Id, storedRefreshToken.TenantId);
                if (candidate == storedRefreshToken.TenantId)
                    activeTenantId = candidate;
            }
            activeTenantId ??= await SelectActiveTenantAsync(user.Id, user.TenantId);

            storedRefreshToken.Revoke(ipAddress, userAgent, RefreshTokenReasons.Rotated);
            _unitOfWork.RefreshTokens.Update(storedRefreshToken);
            await _unitOfWork.SaveChangesAsync();

            var newAccessTokenResult = await GenerateAccessTokenAsync(user, activeTenantId);
            if (!newAccessTokenResult.IsSuccess)
                return Result<LoginResponseDto>.Failure(Error.Failure(
                    ErrorCode.InternalError,
                    _localizer["auth.accessTokenGenerationFailed"]));

            var newRefreshTokenResult = await GenerateRefreshTokenAsync(
                user,
                ipAddress,
                userAgent,
                storedRefreshToken.DeviceId,
                storedRefreshToken.DeviceName,
                rememberMe: false,
                preserveExpiryDate: storedRefreshToken.ExpiryDate,
                tenantId: activeTenantId);
            if (!newRefreshTokenResult.IsSuccess)
                return Result<LoginResponseDto>.Failure(Error.Failure(
                    ErrorCode.InternalError,
                    _localizer["auth.refreshTokenGenerationFailed"]));

            _logger.LogInformation(
                "Token refreshed. UserId: {UserId}, IpAddress: {IpAddress}",
                user.Id, ipAddress);

            return Result<LoginResponseDto>.Success(
                await BuildLoginResponseAsync(user, activeTenantId, newAccessTokenResult.Value, newRefreshTokenResult.Value));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Token refresh failed for user");
            return Result<LoginResponseDto>.Failure(Error.Failure(
                ErrorCode.InternalError,
                _localizer["auth.tokenRefreshUnexpectedError"]));
        }
    }

    /// <summary>
    /// Oturumun aktif hanesini değiştirir: o hanede canlı üyelik ve aktif hane yoksa 403. Mevcut refresh token yeni hane ile
    /// rotate edilir (bitiş tarihi korunur), User.TenantId (son aktif hane) güncellenir. Yanıt login yanıtıyla aynıdır.
    /// </summary>
    public async Task<Result<LoginResponseDto>> SwitchHouseholdAsync(int userId, int tenantId, string refreshToken, string ipAddress, string userAgent)
    {
        try
        {
            var membership = await _unitOfWork.TenantMemberships.GetActiveAsync(userId, tenantId);
            if (membership == null || membership.Tenant == null || !membership.Tenant.IsActive)
                return Result<LoginResponseDto>.Failure(Error.Failure(
                    ErrorCode.Forbidden,
                    _localizer["auth.householdForbidden"]));

            var storedRefreshToken = string.IsNullOrEmpty(refreshToken)
                ? null
                : await _unitOfWork.RefreshTokens.GetByTokenAsync(refreshToken);
            if (storedRefreshToken == null || storedRefreshToken.UserId != userId || !storedRefreshToken.IsActive)
                return Result<LoginResponseDto>.Failure(Error.Failure(
                    ErrorCode.Unauthorized,
                    _localizer["auth.invalidRefreshToken"]));

            var user = await _unitOfWork.Users.GetUserWithRolesAsync(userId);
            if (user == null || user.Status != Domain.Common.Enums.UserStatus.Active)
                return Result<LoginResponseDto>.Failure(Error.Failure(
                    ErrorCode.Unauthorized,
                    _localizer["auth.invalidRefreshToken"]));

            storedRefreshToken.Revoke(ipAddress, userAgent, RefreshTokenReasons.Rotated);
            _unitOfWork.RefreshTokens.Update(storedRefreshToken);

            // Son aktif hane: sonraki login bu haneyle başlar
            user.TenantId = tenantId;
            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();

            var accessTokenResult = await GenerateAccessTokenAsync(user, tenantId);
            if (!accessTokenResult.IsSuccess)
                return Result<LoginResponseDto>.Failure(Error.Failure(
                    ErrorCode.InternalError,
                    _localizer["auth.accessTokenGenerationFailed"]));

            var refreshTokenResult = await GenerateRefreshTokenAsync(
                user,
                ipAddress,
                userAgent,
                storedRefreshToken.DeviceId,
                storedRefreshToken.DeviceName,
                rememberMe: false,
                preserveExpiryDate: storedRefreshToken.ExpiryDate,
                tenantId: tenantId);
            if (!refreshTokenResult.IsSuccess)
                return Result<LoginResponseDto>.Failure(Error.Failure(
                    ErrorCode.InternalError,
                    _localizer["auth.refreshTokenGenerationFailed"]));

            _logger.LogInformation("Household switched. UserId: {UserId}, TenantId: {TenantId}", userId, tenantId);

            return Result<LoginResponseDto>.Success(
                await BuildLoginResponseAsync(user, tenantId, accessTokenResult.Value, refreshTokenResult.Value));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Household switch failed for user {UserId}", userId);
            return Result<LoginResponseDto>.Failure(Error.Failure(
                ErrorCode.InternalError,
                _localizer["auth.tokenRefreshUnexpectedError"]));
        }
    }

    // Kullanıcı nesnesi /me ile aynı koddan (UserProfileBuilder): aktif hane, üyelikler, aktif haneye göre izinler, sistem rolleri
    private async Task<LoginResponseDto> BuildLoginResponseAsync(User user, int? activeTenantId, string accessToken, RefreshTokenIssueResult refreshTokenResult)
    {
        return new LoginResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshTokenResult.PlainToken,
            ExpiresAt = refreshTokenResult.Stored.ExpiryDate,
            User = await Application.Features.Users.Common.UserProfileBuilder.BuildAsync(_unitOfWork, _permissionService, _legalVersions, user, activeTenantId)
        };
    }

    public async Task<Result> RevokeTokenAsync(string refreshToken, string ipAddress = null, string userAgent = null, string reason = null)
        {
            try
            {
                await _unitOfWork.RefreshTokens.RevokeTokenAsync(refreshToken, ipAddress, userAgent, reason);
                await _unitOfWork.SaveChangesAsync();

                _logger.LogInformation(
                    "Logout. IpAddress: {IpAddress}, Reason: {Reason}",
                    ipAddress ?? "unknown", reason ?? "User logout");

                return Result.Success();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to revoke refresh token");
                return Result.Failure(Error.Failure(ErrorCode.InternalError, "Failed to revoke token"));
            }
        }

        public async Task<Result> RevokeAllUserTokensAsync(int userId, string ipAddress = null, string userAgent = null, string reason = null)
        {
            try
            {
                await _unitOfWork.RefreshTokens.RevokeAllUserTokensAsync(userId, ipAddress, userAgent, reason);

                // Also reject access tokens issued before now (other devices keep theirs otherwise)
                var user = await _unitOfWork.Users.GetByIdAsync(userId);
                if (user != null)
                {
                    user.LastSessionsRevokedAt = DateTime.UtcNow;
                    _unitOfWork.Users.Update(user);
                }

                await _unitOfWork.SaveChangesAsync();

                _logger.LogWarning(
                    "All sessions revoked. UserId: {UserId}, IpAddress: {IpAddress}, Reason: {Reason}",
                    userId, ipAddress ?? "unknown", reason ?? "User logout");

                return Result.Success();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to revoke all tokens for user {UserId}", userId);
                return Result.Failure(Error.Failure(ErrorCode.InternalError, "Failed to revoke tokens"));
            }
        }

        public async Task<Result> RevokeTokensByDeviceAsync(int userId, string deviceId, string ipAddress = null, string userAgent = null, string reason = null)
        {
            try
            {
                await _unitOfWork.RefreshTokens.RevokeTokensByDeviceAsync(userId, deviceId, ipAddress, userAgent, reason);
                await _unitOfWork.SaveChangesAsync();
                return Result.Success();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to revoke tokens by device for user {UserId}", userId);
                return Result.Failure(Error.Failure(ErrorCode.InternalError, "Failed to revoke tokens"));
            }
        }

        public ClaimsPrincipal GetClaimsFromExpiredToken(string token)
        {
            try
            {
                var jwtSettings = _configuration.GetSection("JwtSettings");
                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]));

                var tokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = false, // Don't validate lifetime for expired tokens
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings["Issuer"],
                    ValidAudience = jwtSettings["Audience"],
                    IssuerSigningKey = key,
                    ClockSkew = TimeSpan.FromSeconds(30)
                };

                var tokenHandler = new JwtSecurityTokenHandler();
                var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out _);
                return principal;
            }
            catch
            {
                return null;
            }
        }

        public async Task<bool> ValidateTokenAsync(string token)
        {
            try
            {
                var jwtSettings = _configuration.GetSection("JwtSettings");
                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]));

                var tokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings["Issuer"],
                    ValidAudience = jwtSettings["Audience"],
                    IssuerSigningKey = key,
                    ClockSkew = TimeSpan.FromSeconds(30)
                };

                var tokenHandler = new JwtSecurityTokenHandler();
                tokenHandler.ValidateToken(token, tokenValidationParameters, out _);
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
} 
