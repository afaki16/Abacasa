using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Vehicles.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Vehicles.Commands.UpdateVehicle;

public class UpdateVehicleCommand : IRequest<Result<VehicleDto>>
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Plate { get; set; }
    public int? OwnerPersonId { get; set; }
    public bool IsActive { get; set; }
    public string? Note { get; set; }
}
