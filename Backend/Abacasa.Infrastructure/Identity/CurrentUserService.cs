using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Domain.Constants;
using Microsoft.AspNetCore.Http;
using System;
using System.Linq;
using System.Security.Claims;

namespace Abacasa.Infrastructure.Identity
{
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public int? UserId
        {
            get
            {
                var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                return int.TryParse(userIdClaim, out var userId) ? userId : null;
            }
        }

        public int? TenantId
        {
            get
            {
                var tenantIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("tenant_id")?.Value;
                return int.TryParse(tenantIdClaim, out var tenantId) ? tenantId : null;
            }
        }

        public const string TenantHeaderName = "X-Tenant-Id";

        // TenantId bilerek değişmez: ApplicationDbContext'in hane filtresi ve TenantId ataması TenantId'yi kullanır;
        // seçim oraya karışsaydı SuperAdmin seçtiği hanenin bütçe verisini okuyup yazabilirdi.
        public int? SelectedTenantId
        {
            get
            {
                // Header yalnızca SuperAdmin için dikkate alınır; diğer roller başka haneye geçemez.
                if (!CanAccessAllTenants)
                    return null;

                var header = _httpContextAccessor.HttpContext?.Request.Headers[TenantHeaderName].FirstOrDefault();
                return int.TryParse(header, out var tenantId) && tenantId > 0 ? tenantId : null;
            }
        }

        public string Email => _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Email)?.Value;

        public string FullName => _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Name)?.Value;

        public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;

        public bool IsInRole(string role)
        {
            return _httpContextAccessor.HttpContext?.User?.IsInRole(role) ?? false;
        }


        public bool CanAccessAllTenants => IsInRole(RoleNames.SuperAdmin);
    }
} 
