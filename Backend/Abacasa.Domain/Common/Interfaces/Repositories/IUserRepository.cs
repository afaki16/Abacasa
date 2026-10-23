using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Abacasa.Domain.Common.Interfaces.Repositories
{
    public interface IUserRepository : IRepository<User,int>
    {
        // E-posta tüm sistemde benzersizdir (kimlik global); e-posta normalize (trim + küçük harf) verilir
        Task<User> GetByEmailAsync(string email);

        // Login için: sistem rolleriyle, tracking'li
        Task<User> GetByEmailWithRolesAsync(string email);
        Task<User> GetUserWithRolesAsync(int userId);

        /// <summary>
        /// Read-only variant of GetUserWithRolesAsync - returns the user with no change tracking.
        /// Use this from Query handlers; use GetUserWithRolesAsync from Command handlers that
        /// will modify the returned entity.
        /// </summary>
        Task<User> GetUserWithRolesReadOnlyAsync(int userId);
        Task<User> GetUserWithPermissionsAsync(int userId);
        /// <param name="excludeUserId">If set, that user is ignored (for updates).</param>
        Task<bool> EmailExistsAsync(string email, int? excludeUserId = null);
        /// <param name="excludeUserId">If set, that user is ignored (for updates).</param>
        // Telefon global: hane fark etmez (normalize edilmiş biçim beklenir)
        Task<bool> PhoneExistsAsync(string phoneNumber, int? excludeUserId = null);
        Task<UserRole> GetUserRoleAsync(int userId, int roleId);
        Task AddUserRoleAsync(UserRole userRole);
        void RemoveUserRole(UserRole userRole);
        Task<(IEnumerable<User> Users, int TotalCount)> GetUsersPagedAsync(int page, int pageSize, string searchTerm = null, int? tenantId = null, bool excludeUsersWithSuperAdminRole = false);
        Task<IEnumerable<int>> GetUserIdsByRoleIdAsync(int roleId);
        Task<int> CountActiveSuperAdminsAsync();

        /// <summary>
        /// Lightweight per-request session check, tek sorgu. tenantId token'daki aktif hanedir:
        /// TenantOk, tenantId yoksa true; varsa o hanede canlı üyelik olmalı ve hane aktif olmalı.
        /// Returns null when the user does not exist.
        /// </summary>
        Task<(DateTime? LastSessionsRevokedAt, UserStatus Status, bool TenantOk)?> GetSessionStateAsync(int userId, int? tenantId);

        Task<bool> TenantHasSuperAdminAsync(int tenantId);

        Task<int> CountByTenantIdAsync(int tenantId);
    }
} 
