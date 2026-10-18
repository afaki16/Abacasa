using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.Tenants.Commands.DeleteTenant;

    public class DeleteTenantCommand : IRequest<Result<bool>>
{
    public int Id { get; set; }
}
