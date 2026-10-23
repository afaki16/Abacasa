using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Abacasa.Application.Interfaces;

namespace Abacasa.Infrastructure.Authorization
{
    public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
    {
        private readonly IPermissionService _permissionService;

        public PermissionAuthorizationHandler(IPermissionService permissionService)
        {
            _permissionService = permissionService;
        }

        protected override async Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            PermissionRequirement requirement)
        {
            if (!context.User.Identity?.IsAuthenticated ?? true)
            {
                context.Fail();
                return;
            }

            var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                context.Fail();
                return;
            }

            // Hane kaynaklarının izinleri token'daki aktif haneye (tenant_id) göre hesaplanır
            int? tenantId = int.TryParse(context.User.FindFirst("tenant_id")?.Value, out var tid) ? tid : null;

            var result = await _permissionService.HasPermissionAsync(userId, tenantId, requirement.Permission);

            if (result.IsSuccess && result.Value)
            {
                context.Succeed(requirement);
            }
            else
            {
                context.Fail();
            }
        }
    }
}
