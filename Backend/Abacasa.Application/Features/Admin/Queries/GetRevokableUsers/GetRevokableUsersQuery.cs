using Abacasa.Application.Features.Admin.Dtos;
using Abacasa.Application.Common.Results;
using MediatR;
using System.Collections.Generic;

namespace Abacasa.Application.Features.Admin.Queries.GetRevokableUsers
{
    public class GetRevokableUsersQuery : IRequest<Result<IEnumerable<RevokableUserDto>>>
    {
        /// <summary>
        /// Optional. SuperAdmin can filter by tenant. Admin uses own tenant.
        /// </summary>
        public int? TenantId { get; set; }
    }
}
