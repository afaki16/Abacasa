using Microsoft.AspNetCore.Builder;
using Abacasa.API.Middleware;

namespace Abacasa.API.Extensions
{
    public static class SecurityHeadersMiddlewareExtensions
    {
        public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<SecurityHeadersMiddleware>();
        }
    }
}
