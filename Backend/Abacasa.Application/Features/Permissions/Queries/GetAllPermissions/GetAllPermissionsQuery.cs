using Abacasa.Application.Features.Users.Dtos;
using Abacasa.Application.Features.Roles.Dtos;
using Abacasa.Application.Features.Tenants.Dtos;
using Abacasa.Application.Features.Permissions.Dtos;
using Abacasa.Application.Common.Results;
using MediatR;
using System.Collections.Generic;

namespace Abacasa.Application.Features.Permissions.Queries.GetAllPermissions
{
    public class GetAllPermissionsQuery : IRequest<Result<IEnumerable<PermissionDto>>>
    {
    }
} 
