using Abacasa.API.Controllers;
using Abacasa.API.Filters;
using Abacasa.Application.Features.Auth.Dtos;
using Abacasa.Application.Features.Auth.Commands.Login;
using Abacasa.Application.Features.Auth.Commands.Logout;
using Abacasa.Application.Features.Auth.Commands.LogoutAll;
using Abacasa.Application.Features.Auth.Commands.LogoutDevice;
using Abacasa.Application.Features.Auth.Commands.Register;
using Abacasa.Application.Features.Auth.Commands.RefreshToken;
using Abacasa.Application.Features.Auth.Commands.RevokeSessionById;
using Abacasa.Application.Features.Auth.Commands.ChangePassword;
using Abacasa.Application.Features.Auth.Commands.ForgotPassword;
using Abacasa.Application.Features.Auth.Commands.ResetPassword;
using Abacasa.Application.Features.Auth.Commands.VerifyEmail;
using Abacasa.Application.Features.Auth.Commands.UpdateProfile;
using Abacasa.Application.Features.Auth.Commands.RequestEmailChange;
using Abacasa.Application.Features.Auth.Commands.ConfirmEmailChange;
using Abacasa.Application.Features.Auth.Commands.PasswordCodes;
using Abacasa.Application.Features.Auth.Commands.ResendVerificationEmail;
using Abacasa.Application.Features.Auth.Commands.SwitchHousehold;
using Abacasa.Application.Features.Auth.Commands.DeleteAccount;
using Abacasa.Application.Features.Auth.Commands.AcceptConsents;
using Abacasa.Application.Features.Auth.Queries.ExportAccount;
using Abacasa.Application.Features.Legal.Dtos;
using Abacasa.Application.Features.Auth.Queries.GetAccountDeletionPreview;
using Abacasa.Application.Features.Auth.Queries.GetUserSessions;
using Abacasa.Application.Features.Auth.Queries.CheckRegisterAvailability;
using Abacasa.Application.Features.Users.Queries.GetCurrentUser;
using Abacasa.Application.Features.Users.Commands.UserPhoto;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Abacasa.API.Controllers
{
    [Route("api/[controller]")]
    public class AuthController : BaseController
    {
        private readonly IMediator _mediator;

        public AuthController(IMediator mediator)
        {
            _mediator = mediator;
        }

        /// <summary>
        /// Login with email and password
        /// </summary>
        /// <param name="request">Login credentials</param>
        /// <returns>Access token and user information</returns>
        [HttpPost("login")]
        [AllowAnonymous]
        [EnableRateLimiting("login")]
        [ProducesResponseType(typeof(LoginResponseDto), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            var command = new LoginCommand
            {
                Email = request.Email,
                Password = request.Password,
                RememberMe = request.RememberMe,
                TenantId = request.TenantId,
                DeviceId = request.DeviceId,
                DeviceName = request.DeviceName,
                IpAddress = GetIpAddress(),
                UserAgent = GetUserAgent()
            };

            var result = await _mediator.Send(command);

            // The refresh token goes out only as an HttpOnly cookie (see DeliverRefreshToken).
            if (result.IsSuccess && result.Value is not null)
            {
                DeliverRefreshToken(result.Value);
            }

            return HandleResult(result);
        }

        /// <summary>
        /// Switch the session's active household. Requires a live membership in an active household (403 otherwise).
        /// The current refresh token is rotated with the new household; the response has the login shape.
        /// </summary>
        [HttpPost("switch-household")]
        [Authorize]
        [ProducesResponseType(typeof(LoginResponseDto), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        public async Task<IActionResult> SwitchHousehold([FromBody] SwitchHouseholdRequestDto request)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userId, out var userIdInt))
                return Unauthorized();

            var result = await _mediator.Send(new SwitchHouseholdCommand
            {
                UserId = userIdInt,
                TenantId = request.TenantId,
                RefreshToken = ReadRefreshToken(request.RefreshToken),
                IpAddress = GetIpAddress(),
                UserAgent = GetUserAgent()
            });

            // Rotate the cookie too so the new refresh token (with the new household) replaces the old one.
            if (result.IsSuccess && result.Value is not null)
            {
                DeliverRefreshToken(result.Value);
            }

            return HandleResult(result);
        }

        /// <summary>
        /// Live email/phone availability check for the public register form
        /// </summary>
        [HttpPost("check-availability")]
        [AllowAnonymous]
        [EnableRateLimiting("availability")]
        [ProducesResponseType(typeof(CheckAvailabilityDto), 200)]
        [ProducesResponseType(429)]
        public async Task<IActionResult> CheckAvailability([FromBody] CheckRegisterAvailabilityQuery request)
        {
            var result = await _mediator.Send(new CheckRegisterAvailabilityQuery
            {
                Email = request?.Email,
                PhoneNumber = request?.PhoneNumber
            });
            return HandleResult(result);
        }

        /// <summary>
        /// Register a new user account
        /// </summary>
        /// <param name="request">Registration information</param>
        /// <returns>Created user information</returns>
        [HttpPost("register")]
        [AllowAnonymous]
        [EnableRateLimiting("sensitive")]
        [ProducesResponseType(typeof(Application.Features.Users.Dtos.UserDto), 201)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
        {
            var command = new RegisterCommand
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                Password = request.Password,
                ConfirmPassword = request.ConfirmPassword,
                PhoneNumber = request.PhoneNumber,
                HouseholdName = request.HouseholdName,
                InviteToken = request.InviteToken,
                AcceptTerms = request.AcceptTerms,
                AcknowledgePrivacy = request.AcknowledgePrivacy,
                IpAddress = GetIpAddress(),
                UserAgent = GetUserAgent()
            };

            var result = await _mediator.Send(command);

            if (result.IsSuccess)
                return CreatedAtAction(nameof(Login), new { }, new { success = true, data = result.Value });
            
            return HandleResult(result);
        }

        /// <summary>
        /// Refresh access token using refresh token
        /// </summary>
        /// <param name="request">Token refresh information</param>
        /// <returns>New access token and refresh token</returns>
        [HttpPost("refresh-token")]
        [AllowAnonymous]
        [EnableRateLimiting("refresh")]
        [ProducesResponseType(typeof(LoginResponseDto), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto request)
        {
            // Cookie takes priority over body. Mobile/CLI clients without a cookie jar
            // can still pass refreshToken in the body.
            var refreshToken = ReadRefreshToken(request.RefreshToken);

            var command = new RefreshTokenCommand
            {
                AccessToken = request.AccessToken,
                RefreshToken = refreshToken,
                IpAddress = GetIpAddress(),
                UserAgent = GetUserAgent()
            };

            var result = await _mediator.Send(command);

            // Rotate the cookie too so the new refresh token replaces the old one.
            if (result.IsSuccess && result.Value is not null)
            {
                DeliverRefreshToken(result.Value);
            }

            return HandleResult(result);
        }

        /// <summary>
        /// Logout and revoke refresh token
        /// </summary>
        /// <param name="request">Logout information</param>
        /// <returns>Success message</returns>
        [HttpPost("logout")]
        [Authorize]
        [AllowWhenPasswordChangeRequired]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> Logout([FromBody] LogoutRequestDto request)
        {
            // Same dual-mode read as refresh.
            var refreshToken = ReadRefreshToken(request.RefreshToken);

            var command = new LogoutCommand
            {
                RefreshToken = refreshToken,
                IpAddress = GetIpAddress(),
                UserAgent = GetUserAgent(),
                Reason = request.Reason
            };

            var result = await _mediator.Send(command);

            // Always clear the cookie on logout, even if the command failed - the user's
            // intent is clear and a stale cookie left behind is a footgun.
            ClearRefreshTokenCookie();

            return HandleResult(result);
        }

        /// <summary>
        /// Logout from all devices
        /// </summary>
        /// <returns>Success message</returns>
        [HttpPost("logout-all")]
        [Authorize]
        [AllowWhenPasswordChangeRequired]
        [ProducesResponseType(200)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> LogoutAll()
        {
            var command = new LogoutAllCommand
            {
                IpAddress = GetIpAddress(),
                UserAgent = GetUserAgent(),
                Reason = "User requested logout from all devices"
            };

            var result = await _mediator.Send(command);
            return HandleResult(result);
        }

        /// <summary>
        /// Logout from specific device
        /// </summary>
        /// <param name="deviceId">Device ID to logout from</param>
        /// <returns>Success message</returns>
        [HttpPost("logout-device/{deviceId}")]
        [Authorize]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> LogoutDevice(string deviceId)
        {
            var command = new LogoutDeviceCommand
            {
                DeviceId = deviceId,
                IpAddress = GetIpAddress(),
                UserAgent = GetUserAgent(),
                Reason = "User requested logout from specific device"
            };

            var result = await _mediator.Send(command);
            return HandleResult(result);
        }

        /// <summary>
        /// Get current user information (with permissions for auth restoration)
        /// </summary>
        /// <returns>Current user details including roles and permissions</returns>
        [HttpGet("me")]
        [Authorize]
        [AllowWhenPasswordChangeRequired]
        [ProducesResponseType(typeof(Application.Features.Users.Dtos.UserDto), 200)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            
            if (!int.TryParse(userId, out var userIdInt))
                return Unauthorized();

            var query = new GetCurrentUserQuery { UserId = userIdInt };
            var result = await _mediator.Send(query);
            
            return HandleResult(result);
        }

        /// <summary>
        /// Export the signed-in user's personal data as an Excel file (no token values)
        /// </summary>
        [HttpGet("account/export")]
        [Authorize]
        [ProducesResponseType(typeof(FileContentResult), 200)]
        public async Task<IActionResult> ExportAccount()
        {
            var result = await _mediator.Send(new ExportAccountQuery());
            if (!result.IsSuccess)
                return HandleResult(result);

            return File(result.Value.Content, Application.Interfaces.ExportFile.XlsxContentType, result.Value.FileName);
        }

        /// <summary>
        /// Accept legal documents ("Terms" / "PrivacyNotice") with their current versions; returns the remaining pending consents
        /// </summary>
        [HttpPost("consents")]
        [Authorize]
        [AllowWhenPasswordChangeRequired]
        [ProducesResponseType(typeof(ConsentStatusDto), 200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> AcceptConsents([FromBody] AcceptConsentsRequestDto request)
        {
            return HandleResult(await _mediator.Send(new AcceptConsentsCommand { DocumentTypes = request.DocumentTypes }));
        }

        /// <summary>
        /// Account deletion preview: households where the user is the last admin (blocked),
        /// households where the user is the only member (deleted with the account), last SuperAdmin flag
        /// </summary>
        [HttpGet("account/deletion-preview")]
        [Authorize]
        [ProducesResponseType(typeof(AccountDeletionPlan), 200)]
        public async Task<IActionResult> GetAccountDeletionPreview()
        {
            return HandleResult(await _mediator.Send(new GetAccountDeletionPreviewQuery()));
        }

        /// <summary>
        /// Delete (anonymize) the signed-in user's account. Sole-member households are deleted only with
        /// deleteSoleHouseholds = true. Clears the refresh token cookie.
        /// </summary>
        [HttpDelete("account")]
        [Authorize]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountRequestDto request)
        {
            var result = await _mediator.Send(new DeleteAccountCommand
            {
                Password = request.Password,
                DeleteSoleHouseholds = request.DeleteSoleHouseholds
            });

            if (result.IsSuccess)
                ClearRefreshTokenCookie();

            return HandleResult(result);
        }

        /// <summary>
        /// Get user's active sessions
        /// </summary>
        /// <returns>List of active sessions</returns>
        [HttpGet("sessions")]
        [Authorize]
        [ProducesResponseType(typeof(IEnumerable<SessionDto>), 200)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> GetUserSessions()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            
            if (!int.TryParse(userId, out var userIdInt))
                return Unauthorized();

            var query = new GetUserSessionsQuery { UserId = userIdInt };
            var result = await _mediator.Send(query);
            
            return HandleResult(result);
        }


        /// <summary>
        /// Revoke a specific session by its ID (current user only)
        /// </summary>
        [HttpPost("sessions/{sessionId}/revoke")]
        [Authorize]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> RevokeSessionById(int sessionId)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var command = new RevokeSessionByIdCommand
            {
                SessionId = sessionId,
                RequestingUserId = userId,
                IpAddress = GetIpAddress(),
                UserAgent = GetUserAgent()
            };

            var result = await _mediator.Send(command);
            return HandleResult(result);
        }

        /// <summary>
        /// Change password
        /// </summary>
        /// <param name="request">Password change request</param>
        /// <returns>Success message</returns>
        [HttpPost("change-password")]
        [Authorize]
        [EnableRateLimiting("sensitive")]
        [AllowWhenPasswordChangeRequired]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request)
        {
            var command = new ChangePasswordCommand
            {
                CurrentPassword = request.CurrentPassword,
                NewPassword = request.NewPassword,
                IpAddress = GetIpAddress(),
                UserAgent = GetUserAgent()
            };

            var result = await _mediator.Send(command);
            return HandleResult(result);
        }

        /// <summary>
        /// Forgot password
        /// </summary>
        /// <param name="request">Forgot password request</param>
        /// <returns>Success message</returns>
        [HttpPost("forgot-password")]
        [AllowAnonymous]
        [EnableRateLimiting("sensitive")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto request)
        {
            var command = new ForgotPasswordCommand
            {
                Email = request.Email,
                TenantId = request.TenantId,
                IpAddress = GetIpAddress(),
                UserAgent = GetUserAgent()
            };

            var result = await _mediator.Send(command);
            return HandleResult(result);
        }

        /// <summary>
        /// Reset password
        /// </summary>
        /// <param name="request">Reset password request</param>
        /// <returns>Success message</returns>
        [HttpPost("reset-password")]
        [AllowAnonymous]
        [EnableRateLimiting("sensitive")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto request)
        {
            var command = new ResetPasswordCommand
            {
                Email = request.Email,
                Token = request.Token,
                NewPassword = request.NewPassword,
                IpAddress = GetIpAddress(),
                UserAgent = GetUserAgent()
            };

            var result = await _mediator.Send(command);
            return HandleResult(result);
        }

        /// <summary>
        /// Forgot password with a 6-digit code (mobile-friendly alternative to the link). Always returns 200.
        /// Identity is global, so only the email is used (a tenantId in the body is ignored).
        /// </summary>
        [HttpPost("forgot-password/code")]
        [AllowAnonymous]
        [EnableRateLimiting("sensitive")]
        [ProducesResponseType(200)]
        public async Task<IActionResult> SendPasswordResetCode([FromBody] ForgotPasswordRequestDto request)
        {
            var result = await _mediator.Send(new SendPasswordResetCodeCommand
            {
                Email = request.Email,
                IpAddress = GetIpAddress()
            });
            return HandleResult(result);
        }

        /// <summary>
        /// Set a new password with the code from forgot-password/code
        /// </summary>
        [HttpPost("reset-password/code")]
        [AllowAnonymous]
        [EnableRateLimiting("sensitive")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> ResetPasswordWithCode([FromBody] ResetPasswordWithCodeRequestDto request)
        {
            var result = await _mediator.Send(new ResetPasswordWithCodeCommand
            {
                Email = request.Email,
                Code = request.Code,
                NewPassword = request.NewPassword,
                IpAddress = GetIpAddress()
            });
            return HandleResult(result);
        }

        /// <summary>
        /// Signed in but forgot the current password: email a code for changing it.
        /// Also reachable while a password change is required (MustChangePassword).
        /// </summary>
        [HttpPost("password-change/code")]
        [Authorize]
        [AllowWhenPasswordChangeRequired]
        [EnableRateLimiting("sensitive")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> SendPasswordChangeCode()
        {
            var result = await _mediator.Send(new SendPasswordChangeCodeCommand { IpAddress = GetIpAddress() });
            return HandleResult(result);
        }

        /// <summary>
        /// Change the password with the emailed code instead of the current password. Signs out everywhere.
        /// </summary>
        [HttpPost("password-change/confirm")]
        [Authorize]
        [AllowWhenPasswordChangeRequired]
        [EnableRateLimiting("sensitive")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> ChangePasswordWithCode([FromBody] ChangePasswordWithCodeRequestDto request)
        {
            var result = await _mediator.Send(new ChangePasswordWithCodeCommand
            {
                Code = request.Code,
                NewPassword = request.NewPassword
            });
            return HandleResult(result);
        }

        /// <summary>
        /// Update the signed-in user's own name and phone number
        /// </summary>
        [HttpPut("profile")]
        [Authorize]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequestDto request)
        {
            var command = new UpdateProfileCommand
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                PhoneNumber = request.PhoneNumber
            };

            var result = await _mediator.Send(command);
            return HandleResult(result);
        }

        /// <summary>
        /// Upload or replace the signed-in user's profile photo (multipart field "file";
        /// JPEG, PNG or WEBP up to 10 MB). Stored as a 512 px WEBP without metadata.
        /// </summary>
        [HttpPost("profile/photo")]
        [Authorize]
        // Slightly above SetUserPhotoCommand.MaxBytes so oversized files get a readable error
        [RequestSizeLimit(11 * 1024 * 1024)]
        [RequestFormLimits(MultipartBodyLengthLimit = 11 * 1024 * 1024)]
        [ProducesResponseType(typeof(UserPhotoDto), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> UploadProfilePhoto(IFormFile? file)
        {
            await using var content = file?.OpenReadStream() ?? Stream.Null;
            var result = await _mediator.Send(new SetUserPhotoCommand { Content = content, Length = file?.Length ?? 0 });
            return HandleResult(result);
        }

        /// <summary>
        /// Remove the signed-in user's profile photo
        /// </summary>
        [HttpDelete("profile/photo")]
        [Authorize]
        [ProducesResponseType(typeof(UserPhotoDto), 200)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> RemoveProfilePhoto()
        {
            var result = await _mediator.Send(new RemoveUserPhotoCommand());
            return HandleResult(result);
        }

        /// <summary>
        /// Start an email change: verifies the current password and emails a confirmation link to the new
        /// address. The account email does not change until that link is used.
        /// </summary>
        [HttpPut("profile/email")]
        [Authorize]
        [EnableRateLimiting("sensitive")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        public async Task<IActionResult> RequestEmailChange([FromBody] RequestEmailChangeRequestDto request)
        {
            var command = new RequestEmailChangeCommand
            {
                NewEmail = request.NewEmail,
                CurrentPassword = request.CurrentPassword,
                IpAddress = GetIpAddress()
            };

            var result = await _mediator.Send(command);
            return HandleResult(result);
        }

        /// <summary>
        /// Apply a pending email change from the link sent to the new address. Signs the user out everywhere.
        /// </summary>
        [HttpPost("confirm-email-change")]
        [AllowAnonymous]
        [EnableRateLimiting("sensitive")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> ConfirmEmailChange([FromBody] VerifyEmailRequestDto request)
        {
            var command = new ConfirmEmailChangeCommand
            {
                Email = request.Email,
                Token = request.Token,
                IpAddress = GetIpAddress()
            };

            var result = await _mediator.Send(command);
            return HandleResult(result);
        }

        /// <summary>
        /// Verify email address using verification token
        /// </summary>
        [HttpPost("verify-email")]
        [AllowAnonymous]
        [EnableRateLimiting("sensitive")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequestDto request)
        {
            var command = new VerifyEmailCommand
            {
                Email = request.Email,
                Token = request.Token,
                IpAddress = GetIpAddress()
            };

            var result = await _mediator.Send(command);
            return HandleResult(result);
        }

        /// <summary>
        /// Resend email verification link
        /// </summary>
        [HttpPost("resend-verification")]
        [AllowAnonymous]
        [EnableRateLimiting("sensitive")]
        [ProducesResponseType(200)]
        public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationRequestDto request)
        {
            var command = new ResendVerificationEmailCommand
            {
                Email = request.Email,
                TenantId = request.TenantId,
                IpAddress = GetIpAddress(),
                UserAgent = GetUserAgent()
            };

            var result = await _mediator.Send(command);
            return HandleResult(result);
        }

        // ??? Refresh-token cookie helpers ?????????????????????????????????????
        // We support both modes simultaneously to allow zero-downtime frontend migration:
        //   - Web clients should rely on the HttpOnly cookie (set by Login/Refresh, sent
        //     automatically by browser, never readable from JS so XSS can't steal it).
        //   - Mobile/CLI clients (no cookie jar) keep sending the token in the body.
        // The body always wins as a fallback so old clients keep working until they switch.

        private const string RefreshCookieName = "refresh_token";

        // Native apps send "X-Client: mobile" and keep the refresh token in the OS keystore. They get no
        // cookie and their cookie is never read: React Native's networking stack persists cookies in a
        // plain-text app database (Android: app_webview/Default/Cookies), which would leave an unencrypted
        // copy of the token outside the keystore and inside device backups. (Kickstart item 26)
        private const string ClientHeaderName = "X-Client";
        private const string MobileClientValue = "mobile";

        private bool IsMobileClient =>
            string.Equals(Request.Headers[ClientHeaderName].ToString(), MobileClientValue, StringComparison.OrdinalIgnoreCase);

        // Web: cookie only, and the token is removed from the body so an XSS can't read a long-lived
        // credential from the response. Native clients have no cookie and keep it in the body.
        private void DeliverRefreshToken(LoginResponseDto response)
        {
            if (IsMobileClient)
                return;

            WriteRefreshTokenCookie(response.RefreshToken, response.ExpiresAt);
            response.RefreshToken = null!;
        }

        private void WriteRefreshTokenCookie(string token, DateTime expiresAtUtc)
        {
            if (IsMobileClient)
                return;

            // Secure=true requires HTTPS; allow HTTP only in Development.
            var isDev = HttpContext.RequestServices
                .GetRequiredService<IHostEnvironment>()
                .IsDevelopment();

            Response.Cookies.Append(RefreshCookieName, token, new CookieOptions
            {
                HttpOnly = true,                            // JS can't read it - XSS protection
                Secure = !isDev,                            // HTTPS-only in prod
                SameSite = SameSiteMode.Strict,             // CSRF protection
                Path = "/api/auth",                         // scoped to auth endpoints
                Expires = expiresAtUtc                      // matches token lifetime
            });
        }

        private void ClearRefreshTokenCookie()
        {
            // Also runs for mobile clients: deletes a cookie a device stored before it sent X-Client.
            // Same options as Append so the browser actually overwrites the existing cookie.
            // Missing options here would make this no-op for some browsers.
            var isDev = HttpContext.RequestServices
                .GetRequiredService<IHostEnvironment>()
                .IsDevelopment();

            Response.Cookies.Append(RefreshCookieName, string.Empty, new CookieOptions
            {
                HttpOnly = true,
                Secure = !isDev,
                SameSite = SameSiteMode.Strict,
                Path = "/api/auth",
                Expires = DateTimeOffset.UnixEpoch          // immediately expired
            });
        }

        private string? ReadRefreshToken(string? bodyValue)
        {
            // Mobile: body only — a stale cookie left in the device's jar must never override it.
            if (IsMobileClient)
                return bodyValue;

            // Cookie wins for web clients; body is the fallback for clients without a cookie jar.
            if (Request.Cookies.TryGetValue(RefreshCookieName, out var cookieValue)
                && !string.IsNullOrEmpty(cookieValue))
                return cookieValue;

            return bodyValue;
        }
    }
}
