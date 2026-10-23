using AutoMapper;
using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Vehicles.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;
using System.Collections.Generic;
using System.Linq;

namespace Abacasa.Application.Features.Vehicles.Queries.GetVehicleObligations;

public class GetVehicleObligationsQueryHandler : IRequestHandler<GetVehicleObligationsQuery, Result<List<VehicleObligationDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJsonStringLocalizer _localizer;

    public GetVehicleObligationsQueryHandler(IUnitOfWork unitOfWork, IMapper mapper, IJsonStringLocalizer localizer)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _localizer = localizer;
    }

    public async Task<Result<List<VehicleObligationDto>>> Handle(GetVehicleObligationsQuery request, CancellationToken cancellationToken)
    {
        // Önce araç filtreli yüklenir; başka hanenin aracı bulunamaz
        var vehicle = await _unitOfWork.Vehicles.GetByIdAsync(request.VehicleId);

        if (vehicle == null)
            return Result<List<VehicleObligationDto>>.Failure(Error.Failure(
                ErrorCode.NotFound,
                _localizer["vehicles.notFound"]));

        var obligations = await _unitOfWork.VehicleObligations.GetByVehicleReadOnlyAsync(vehicle.Id);
        var dtos = _mapper.Map<List<VehicleObligationDto>>(obligations);

        // hasExpense: bağlı harcama Harcamalar'dan silinmiş olabilir; canlı olanlar tek sorguyla
        var liveExpenseIds = await _unitOfWork.VehicleObligations.GetLiveExpenseIdsAsync(
            obligations.Where(o => o.ExpenseId.HasValue).Select(o => o.ExpenseId!.Value));
        foreach (var dto in dtos)
            dto.HasExpense = dto.ExpenseId.HasValue && liveExpenseIds.Contains(dto.ExpenseId.Value);

        return Result<List<VehicleObligationDto>>.Success(dtos);
    }
}
