using Abacasa.Domain.Entities;
using System.Collections.Generic;

namespace Abacasa.Domain.Entities
{
    public class Role : BaseAuditableEntity
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public bool IsSystemRole { get; set; }
        public int? TenantId { get; set; }

        // Navigation properties
        public ICollection<UserRole> UserRoles { get; set; }
        public ICollection<RolePermission> RolePermissions { get; set; }

        public Role()
        {
            UserRoles = new HashSet<UserRole>();
            RolePermissions = new HashSet<RolePermission>();
            IsSystemRole = false;
        }
    }
} 
