using System;

namespace Abacasa.Application.Interfaces
{
    public interface ICurrentUserService
    {
        int? UserId { get; }
        /// <summary>
        /// Token'daki aktif hane (tenant_id claim). Hane verisinin tenant filtresi bunu kullanır; X-Tenant-Id bunu değiştirmez.
        /// </summary>
        int? TenantId { get; }
        /// <summary>
        /// Yalnızca SuperAdmin: üst bardaki hane seçicisinde seçilen hane (X-Tenant-Id header). Seçim yoksa (platform görünümü)
        /// ya da çağıran SuperAdmin değilse null; diğer rollerin header'ı yok sayılır. Yalnızca sistem kaynaklarının
        /// (kullanıcı listesi, Ayarlar'daki oturum sorguları) filtresinde kullanılır; hane bütçe verisine erişim vermez.
        /// </summary>
        int? SelectedTenantId { get; }
        string Email { get; }
        string FullName { get; }
        bool IsAuthenticated { get; }
        bool IsInRole(string role);
        /// <summary>
        /// True when user can access all tenants (e.g. SuperAdmin). When false, user is scoped to their own tenant.
        /// </summary>
        bool CanAccessAllTenants { get; }
    }
} 
