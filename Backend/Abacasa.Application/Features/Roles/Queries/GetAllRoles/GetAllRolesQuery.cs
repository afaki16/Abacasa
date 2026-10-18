using Abacasa.Application.Features.Users.Dtos;
using Abacasa.Application.Features.Roles.Dtos;
using Abacasa.Application.Features.Tenants.Dtos;
using Abacasa.Application.Features.Permissions.Dtos;
using Abacasa.Application.Common.Results;
using MediatR;
using System.Collections.Generic;

namespace Abacasa.Application.Features.Roles.Queries.GetAllRoles
{
    public class GetAllRolesQuery : IRequest<PagedResult<RoleDto>>
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string SearchTerm { get; set; }
    }
} 
