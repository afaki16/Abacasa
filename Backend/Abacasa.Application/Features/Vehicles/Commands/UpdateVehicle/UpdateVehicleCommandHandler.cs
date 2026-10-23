using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Vehicles.Common;
using Abacasa.Application.Features.Vehicles.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using MediatR;
using System.Linq;

namespace Abacasa.Application.Features.Vehicles.Commands.UpdateVehicle;

public class UpdateVehicleCommandHandler : IRequestHandler<UpdateVehicleCommand, Result<VehicleDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public UpdateVehicleCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<VehicleDto>> Handle(UpdateVehicleCommand request, CancellationToken cancellationToken)
    {
        // Tracking'li yükle; başka hanenin kaydı filtre yüzünden bulunamaz
        var vehicle = await _unitOfWork.Vehicles.GetWithOwnerAsync(request.Id);

        if (vehicle == null)
            return Result<VehicleDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["vehicles.notFound"]));

        Person? owner = null;
        if (request.OwnerPersonId.HasValue)
        {
            owner = await _unitOfWork.People.GetByIdAsync(request.OwnerPersonId.Value);
            if (owner == null)
                return Result<VehicleDto>.Failure(Error.Failure(
                    ErrorCode.ValidationFailed,
                    _localizer["vehicles.ownerNotFound"]));
        }

        var plate = request.Plate.Trim().ToUpperInvariant();

        if (await _unitOfWork.Vehicles.PlateExistsAsync(plate, request.Id))
            return Result<VehicleDto>.Failure(Error.Failure(
                ErrorCode.AlreadyExists,
                _localizer["vehicles.plateExists"]));

        vehicle.Name = request.Name.Trim();
        vehicle.Plate = plate;
        vehicle.OwnerPersonId = owner?.Id;
        vehicle.OwnerPerson = owner;
        vehicle.IsActive = request.IsActive;
        vehicle.Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();

        _unitOfWork.Vehicles.Update(vehicle);
        await _unitOfWork.SaveChangesAsync();

        var dto = _mapper.Map<VehicleDto>(vehicle);
        var obligations = await _unitOfWork.VehicleObligations.GetByVehiclesReadOnlyAsync(new[] { vehicle.Id });
        dto.Current = VehicleObligationRules.PickCurrent(obligations)
            .OrderBy(o => o.Type)
            .Select(o => new VehicleCurrentDto { Type = o.Type, ValidUntil = o.ValidUntil, LastAmount = o.Amount })
            .ToList();

        return Result<VehicleDto>.Success(dto);
    }
}
