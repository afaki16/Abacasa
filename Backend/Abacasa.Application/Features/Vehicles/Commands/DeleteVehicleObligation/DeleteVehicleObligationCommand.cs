using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.Vehicles.Commands.DeleteVehicleObligation;

public class DeleteVehicleObligationCommand : IRequest<Result<bool>>
{
    public int VehicleId { get; set; }
    public int ObligationId { get; set; }
}
