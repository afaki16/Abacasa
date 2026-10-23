using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Vehicles.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using Abacasa.Domain.Models;
using MediatR;

namespace Abacasa.Application.Features.Vehicles.Commands.CreateVehicle;

public class CreateVehicleCommandHandler : IRequestHandler<CreateVehicleCommand, Result<VehicleDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public CreateVehicleCommandHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<VehicleDto>> Handle(CreateVehicleCommand request, CancellationToken cancellationToken)
    {
        // Kişi repository ile yüklenir (tenant filtresi uygulanır); başka hanenin kişisi bulunamaz
        Person? owner = null;
        if (request.OwnerPersonId.HasValue)
        {
            owner = await _unitOfWork.People.GetByIdAsync(request.OwnerPersonId.Value);
            if (owner == null)
                return Result<VehicleDto>.Failure(Error.Failure(
                    ErrorCode.ValidationFailed,
                    _localizer["vehicles.ownerNotFound"]));
        }

        // Plaka büyük harfle saklanır; hanede tek (Türk plakalarında İ yok, kültürden bağımsız büyütülür)
        var plate = request.Plate.Trim().ToUpperInvariant();

        if (await _unitOfWork.Vehicles.PlateExistsAsync(plate))
            return Result<VehicleDto>.Failure(Error.Failure(
                ErrorCode.AlreadyExists,
                _localizer["vehicles.plateExists"]));

        // TenantId ApplicationDbContext tarafından atanır; yeni araç aktif başlar
        var vehicle = new Vehicle
        {
            Name = request.Name.Trim(),
            Plate = plate,
            OwnerPersonId = owner?.Id,
            OwnerPerson = owner,
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim()
        };

        await _unitOfWork.Vehicles.AddAsync(vehicle);
        await _unitOfWork.SaveChangesAsync();

        return Result<VehicleDto>.Success(_mapper.Map<VehicleDto>(vehicle));
    }
}
