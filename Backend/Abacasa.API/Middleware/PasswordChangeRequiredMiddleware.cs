using Abacasa.API.Filters;
using Abacasa.Application.Common.Localization;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;

namespace Abacasa.API.Middleware
{
    /// <summary>
    /// Blocks authenticated requests from users whose MustChangePassword flag is set, except for
    /// endpoints marked with <see cref="AllowWhenPasswordChangeRequiredAttribute"/> or [AllowAnonymous].
    /// The flag is attached as a claim in JwtBearer OnTokenValidated, so the frontend lock cannot be
    /// bypassed by calling the API directly. Must run after UseAuthentication/UseAuthorization.
    /// </summary>
    public class PasswordChangeRequiredMiddleware
    {
        private readonly RequestDelegate _next;

        public PasswordChangeRequiredMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, IJsonStringLocalizer localizer)
        {
            if (context.User.HasClaim(AuthClaimTypes.MustChangePassword, "true"))
            {
                var endpoint = context.GetEndpoint();
                var isAllowed = endpoint == null
                    || endpoint.Metadata.GetMetadata<AllowWhenPasswordChangeRequiredAttribute>() != null
                    || endpoint.Metadata.GetMetadata<IAllowAnonymous>() != null;

                if (!isAllowed)
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    context.Response.ContentType = "application/json";

                    var body = JsonSerializer.Serialize(new
                    {
                        success = false,
                        error = new
                        {
                            status = StatusCodes.Status403Forbidden,
                            code = (int)ErrorCode.PasswordChangeRequired,
                            errors = new Dictionary<string, string[]>
                            {
                                { "error", new[] { localizer["auth.passwordChangeRequired"] } }
                            }
                        }
                    });

                    await context.Response.WriteAsync(body);
                    return;
                }
            }

            await _next(context);
        }
    }
}
