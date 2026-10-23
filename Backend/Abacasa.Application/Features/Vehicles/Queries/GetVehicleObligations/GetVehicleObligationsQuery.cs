using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Vehicles.Dtos;
using MediatR;
using System.Collections.Generic;

namespace Abacasa.Application.Features.Vehicles.Queries.GetVehicleObligations;

public class GetVehicleObligationsQuery : IRequest<Result<List<VehicleObligationDto>>>
{
    public int VehicleId { get; set; }
}
