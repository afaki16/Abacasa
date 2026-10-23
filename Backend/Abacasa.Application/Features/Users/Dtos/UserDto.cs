using Abacasa.Domain.Common.Enums;
using Abacasa.Application.Features.Roles.Dtos;
using Abacasa.Application.Features.Permissions.Dtos;
using System;
using System.Collections.Generic;

namespace Abacasa.Application.Features.Users.Dtos
{
    public class UserDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string? PhoneNumber { get; set; }
        public UserStatus Status { get; set; }
        public DateTime? LastLoginDate { get; set; }
        public bool EmailConfirmed { get; set; }
        public bool PhoneConfirmed { get; set; }
        public string? ProfileImageUrl { get; set; }
        public DateTime CreatedDate { get; set; }
        // Son aktif hane (User.TenantId); erişim üyelikle olur
        public int? TenantId { get; set; }
        // Yalnızca sistem rolleri (login/refresh/me yanıtında)
        public List<RoleDto> Roles { get; set; } = new List<RoleDto>();
        // Login/refresh/me yanıtında aktif haneye göre hesaplanmış izinler
        public List<PermissionDto> Permissions { get; set; } = new List<PermissionDto>();
        // Oturumun aktif hanesi; yoksa null (login/refresh/me yanıtında doldurulur)
        public UserActiveTenantDto? ActiveTenant { get; set; }
        // Kullanıcının canlı üyelikleri (login/refresh/me yanıtında doldurulur)
        public List<UserMembershipDto> Memberships { get; set; } = new List<UserMembershipDto>();
        // Onayı bekleyen belgeler ("Terms" / "PrivacyNotice"): hiç onaylanmamış ya da güncel sürümden eski onaylı
        public List<string> PendingConsents { get; set; } = new List<string>();
    }

    public class UserActiveTenantDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        /// HouseholdRole adı: Admin | Member
        public string Role { get; set; }
    }

    public class UserMembershipDto
    {
        public int TenantId { get; set; }
        public string Name { get; set; }
        /// HouseholdRole adı: Admin | Member
        public string Role { get; set; }
    }
} 
