using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Primitives;
using Abacasa.Application.Interfaces;
using Abacasa.Application.Common.Results;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Constants;

namespace Abacasa.Infrastructure.Services
{
    // İzinler (kullanıcı, aktif hane) ile hesaplanır:
    // (sistem rollerinin izinleri ∩ sistem kaynakları) ∪ (aktif hanedeki canlı üyeliğin rol izinleri ∩ hane kaynakları).
    public class PermissionService(IMemoryCache cache, IUnitOfWork unitOfWork) : IPermissionService
    {
        private const string RolePermCacheKey = "role_permissions_all";
        private const int RoleCacheMinutes = 60;
        private const int UserCacheMinutes = 15;

        private static string UserCacheKey(int userId, int? tenantId) =>
            $"user_permissions_{userId}_{(tenantId.HasValue ? tenantId.Value.ToString() : "none")}";

        // Kullanıcının bütün hane anahtarları bu token'a bağlıdır; iptal edilince hepsi düşer
        private static string UserCtsKey(int userId) => $"user_permissions_cts_{userId}";

        private sealed record RolePermissions(string Name, List<string> Permissions);

        private async Task<Dictionary<int, RolePermissions>> GetRolePermissionsMapAsync()
        {
            if (cache.TryGetValue(RolePermCacheKey, out Dictionary<int, RolePermissions>? map) && map is not null)
                return map;

            var roles = await unitOfWork.Roles.GetAllWithPermissionsAsync();
            map = roles.ToDictionary(
                r => r.Id,
                r => new RolePermissions(r.Name, r.RolePermissions
                    .SelectMany(rp =>
                    {
                        var perms = new List<string> { rp.Permission.FullPermission };
                        foreach (var permType in rp.Permission.GetIndividualPermissions())
                            perms.Add($"{rp.Permission.Resource}.{permType}");
                        return perms;
                    })
                    .Distinct()
                    .ToList())
            );

            cache.Set(RolePermCacheKey, map,
               new MemoryCacheEntryOptions
               {
                   SlidingExpiration = TimeSpan.FromMinutes(RoleCacheMinutes),
                   AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(4)  // worst-case ceiling
               });

            return map;
        }

        private CancellationTokenSource GetUserCts(int userId)
        {
            return cache.GetOrCreate(UserCtsKey(userId), entry =>
            {
                entry.Priority = CacheItemPriority.NeverRemove;
                return new CancellationTokenSource();
            })!;
        }

        public async Task<Result<List<string>>> GetUserPermissionsAsync(int userId, int? tenantId)
        {
            var cacheKey = UserCacheKey(userId, tenantId);

            if (cache.TryGetValue(cacheKey, out List<string>? cached) && cached is not null)
                return Result<List<string>>.Success(cached);

            var user = await unitOfWork.Users.GetUserWithRolesReadOnlyAsync(userId);
            if (user == null)
                return Result<List<string>>.Success(new List<string>());

            var rolePermMap = await GetRolePermissionsMapAsync();

            // Sistem rolleri yalnızca sistem kaynaklarının izinlerini verir
            var permissions = user.UserRoles
                .Where(ur => rolePermMap.ContainsKey(ur.RoleId))
                .SelectMany(ur => rolePermMap[ur.RoleId].Permissions)
                .Where(p => !HouseholdPermissions.IsHouseholdPermission(p))
                .ToList();

            // Hane kaynaklarının izinleri yalnızca aktif hanedeki canlı üyelik rolünden gelir
            if (tenantId.HasValue)
            {
                var membership = await unitOfWork.TenantMemberships.GetActiveAsync(userId, tenantId.Value);
                if (membership != null)
                {
                    var roleName = HouseholdPermissions.RoleNameFor(membership.Role);
                    var householdRole = rolePermMap.Values.FirstOrDefault(r => r.Name == roleName);
                    if (householdRole != null)
                        permissions.AddRange(householdRole.Permissions.Where(HouseholdPermissions.IsHouseholdPermission));
                }
            }

            permissions = permissions.Distinct().ToList();

            var options = new MemoryCacheEntryOptions
            {
                SlidingExpiration = TimeSpan.FromMinutes(UserCacheMinutes),
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1)  // worst-case ceiling
            };
            options.AddExpirationToken(new CancellationChangeToken(GetUserCts(userId).Token));
            cache.Set(cacheKey, permissions, options);

            return Result<List<string>>.Success(permissions);
        }

        public async Task<Result<bool>> HasPermissionAsync(int userId, int? tenantId, string permission)
        {
            var result = await GetUserPermissionsAsync(userId, tenantId);

            return result.Match(
                onSuccess: permissions => Result<bool>.Success(
                    permissions.Contains(permission, StringComparer.OrdinalIgnoreCase)),
                onFailure: errors => Result<bool>.Failure(errors.ToArray())
            );
        }

        public void ClearUserPermissionCache(int userId)
        {
            // Kullanıcının bütün hane anahtarları aynı token'a bağlı; iptal edince hepsi geçersiz olur
            if (cache.TryGetValue(UserCtsKey(userId), out CancellationTokenSource? cts) && cts is not null)
            {
                cache.Remove(UserCtsKey(userId));
                cts.Cancel();
                cts.Dispose();
            }
        }

        public void ClearRolePermissionCache()
        {
            cache.Remove(RolePermCacheKey);
        }
    }
}
