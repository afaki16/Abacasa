using Abacasa.Application.Common.Results;
using Abacasa.Domain.Common.Enums;
using Abacasa.Application.Features.Vehicles.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Vehicles.Commands.CreateVehicle;

public class CreateVehicleCommand : IRequest<Result<VehicleDto>>
{
    public string Name { get; set; }
    public string Plate { get; set; }
    public VehicleType Type { get; set; } = VehicleType.Car;
    public int? OwnerPersonId { get; set; }
    public string? Note { get; set; }
}
