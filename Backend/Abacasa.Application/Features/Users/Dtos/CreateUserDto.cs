using Abacasa.Domain.Common.Enums;
using System;
using System.Collections.Generic;

namespace Abacasa.Application.Features.Users.Dtos
{
    public class CreateUserDto
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        /// <summary>Required unless <see cref="SendAccountInvitation"/> is true.</summary>
        public string? Password { get; set; }
        /// <summary>
        /// When true, the user gets an email link to set their own password instead of an admin-chosen one.
        /// Hesap daveti; hane davetiyle ilgisi yoktur (kullanıcı hanesiz oluşur).
        /// </summary>
        public bool SendAccountInvitation { get; set; }
        public string? PhoneNumber { get; set; }
        public UserStatus Status { get; set; } = UserStatus.Active;
        /// <summary>When true, the user must change their password on first login.</summary>
        public bool MustChangePassword { get; set; }
        public List<int> RoleIds { get; set; } = new List<int>();
        /// <summary>
        /// Optional. Only SuperAdmin can specify. If null, user is created in current user's tenant.
        /// </summary>
        public int? TenantId { get; set; }
    }
} 
