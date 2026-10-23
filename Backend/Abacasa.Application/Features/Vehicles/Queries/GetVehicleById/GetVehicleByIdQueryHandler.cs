using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Vehicles.Common;
using Abacasa.Application.Features.Vehicles.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;
using System.Linq;

namespace Abacasa.Application.Features.Vehicles.Queries.GetVehicleById;

public class GetVehicleByIdQueryHandler : IRequestHandler<GetVehicleByIdQuery, Result<VehicleDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public GetVehicleByIdQueryHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<VehicleDto>> Handle(GetVehicleByIdQuery request, CancellationToken cancellationToken)
    {
        var vehicle = await _unitOfWork.Vehicles.GetWithOwnerReadOnlyAsync(request.Id);

        if (vehicle == null)
            return Result<VehicleDto>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["vehicles.notFound"]));

        var dto = _mapper.Map<VehicleDto>(vehicle);
        var obligations = await _unitOfWork.VehicleObligations.GetByVehiclesReadOnlyAsync(new[] { vehicle.Id });
        dto.Current = VehicleObligationRules.PickCurrent(obligations)
            .OrderBy(o => o.Type)
            .Select(o => new VehicleCurrentDto { Type = o.Type, ValidUntil = o.ValidUntil, LastAmount = o.Amount })
            .ToList();

        return Result<VehicleDto>.Success(dto);
    }
}
