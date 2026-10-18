using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Tenants.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Tenants.Commands.CreateTenant
{
    public class CreateTenantCommand : IRequest<Result<TenantListDto>>
{
    public string Name { get; set; }
    public string Description { get; set; }
    public string Domain { get; set; }
    public bool IsActive { get; set; } = true;
    public string ContactEmail { get; set; }
    public string ContactPhone { get; set; }
}
}