using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Vehicles.Dtos;
using MediatR;
using System;
using System.Collections.Generic;

namespace Abacasa.Application.Features.Vehicles.Queries.GetVehicleReminders;

public class GetVehicleRemindersQuery : IRequest<Result<List<VehicleReminderDto>>>
{
    /// İstemcinin bugünü; sunucu saat dilimine bağımlı olmamak için
    public DateOnly? Today { get; set; }
}
