using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Vehicles.Common;
using Abacasa.Application.Features.Vehicles.Dtos;
using Abacasa.Domain.Common.Interfaces;
using MediatR;
using System.Collections.Generic;

namespace Abacasa.Application.Features.Vehicles.Queries.GetVehicleReminders;

// Hatırlatma hesabı Özet ile ortaktır (VehicleObligationRules.GetRemindersAsync)
public class GetVehicleRemindersQueryHandler : IRequestHandler<GetVehicleRemindersQuery, Result<List<VehicleReminderDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetVehicleRemindersQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<List<VehicleReminderDto>>> Handle(GetVehicleRemindersQuery request, CancellationToken cancellationToken)
    {
        return Result<List<VehicleReminderDto>>.Success(
            await VehicleObligationRules.GetRemindersAsync(_unitOfWork, request.Today!.Value));
    }
}
