using AutoMapper;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Vehicles.Common;
using Abacasa.Application.Features.Vehicles.Dtos;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Models;
using MediatR;
using System.Collections.Generic;
using System.Linq;

namespace Abacasa.Application.Features.Vehicles.Queries.GetAllVehicles;

public class GetAllVehiclesQueryHandler : IRequestHandler<GetAllVehiclesQuery, PagedResult<VehicleDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetAllVehiclesQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PagedResult<VehicleDto>> Handle(GetAllVehiclesQuery request, CancellationToken cancellationToken)
    {
        var filter = new VehicleFilter
        {
            IsActive = request.IsActive,
            SearchTerm = request.SearchTerm
        };

        var (vehicles, totalCount) = await _unitOfWork.Vehicles.GetVehiclesPagedAsync(request.Page, request.PageSize, filter);
        var dtos = _mapper.Map<List<VehicleDto>>(vehicles);

        // Güncel kayıtlar sayfadaki araçlar için tek sorguyla
        var obligations = await _unitOfWork.VehicleObligations.GetByVehiclesReadOnlyAsync(dtos.Select(d => d.Id));
        var currentByVehicle = VehicleObligationRules.PickCurrent(obligations).ToLookup(o => o.VehicleId);
        foreach (var dto in dtos)
            dto.Current = currentByVehicle[dto.Id]
                .OrderBy(o => o.Type)
                .Select(o => new VehicleCurrentDto { Type = o.Type, ValidUntil = o.ValidUntil, LastAmount = o.Amount })
                .ToList();

        var totalPages = (int)System.Math.Ceiling(totalCount / (double)request.PageSize);

        return PagedResult<VehicleDto>.Success(dtos, request.Page, totalPages, totalCount);
    }
}
