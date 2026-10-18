using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.Admin.Queries.GetActiveUserCount
{
    public class GetActiveUserCountQuery : IRequest<Result<int>>
    {
        /// <summary>
        /// When null, counts across all tenants (SuperAdmin only). Otherwise scoped to tenant.
        /// </summary>
        public int? TenantId { get; set; }
    }
}
