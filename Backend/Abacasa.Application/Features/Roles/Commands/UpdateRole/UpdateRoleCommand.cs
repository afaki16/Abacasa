using Abacasa.Application.Features.Users.Dtos;
using Abacasa.Application.Features.Roles.Dtos;
using Abacasa.Application.Features.Tenants.Dtos;
using Abacasa.Application.Features.Permissions.Dtos;
using Abacasa.Application.Common.Results;
using MediatR;
using System;
using System.Collections.Generic;

namespace Abacasa.Application.Features.Roles.Commands.UpdateRole
{
    public class UpdateRoleCommand : IRequest<Result<RoleDto>>
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public List<int> PermissionIds { get; set; } = new List<int>();
    }
} 
