using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.Vehicles.Commands.DeleteVehicle;

public class DeleteVehicleCommand : IRequest<Result<bool>>
{
    public int Id { get; set; }
}
