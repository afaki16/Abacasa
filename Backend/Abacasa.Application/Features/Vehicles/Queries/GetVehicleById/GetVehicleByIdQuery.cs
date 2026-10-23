using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Vehicles.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Vehicles.Queries.GetVehicleById;

public class GetVehicleByIdQuery : IRequest<Result<VehicleDto>>
{
    public int Id { get; set; }
}
