using System;
using System.Collections.Generic;
using Abacasa.Application.Features.Permissions.Dtos;

namespace Abacasa.Application.Features.Roles.Dtos
{
    public class RoleDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public bool IsSystemRole { get; set; }
        public int? TenantId { get; set; }
        public DateTime CreatedDate { get; set; }
        public List<PermissionDto> Permissions { get; set; } = new List<PermissionDto>();
    }
} 
