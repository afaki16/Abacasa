using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Tenants.Dtos;
using MediatR;
namespace Abacasa.Application.Features.Tenants.Queries.GetTenantById
{
    public class GetTenantByIdQuery : IRequest<Result<TenantDto>>
    {
        public int Id { get; set; }
    }
}
