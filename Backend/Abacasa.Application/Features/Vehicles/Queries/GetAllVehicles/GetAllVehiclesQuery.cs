using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Vehicles.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Vehicles.Queries.GetAllVehicles;

public class GetAllVehiclesQuery : IRequest<PagedResult<VehicleDto>>
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string SearchTerm { get; set; }
    public bool? IsActive { get; set; }
}
