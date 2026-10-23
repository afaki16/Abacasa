using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Vehicles.Dtos;
using Abacasa.Domain.Common.Enums;
using MediatR;
using System;

namespace Abacasa.Application.Features.Vehicles.Commands.UpdateVehicleObligation;

public class UpdateVehicleObligationCommand : IRequest<Result<VehicleObligationDto>>
{
    public int VehicleId { get; set; }
    public int ObligationId { get; set; }
    public VehicleObligationType Type { get; set; }
    public DateOnly Date { get; set; }
    public DateOnly ValidUntil { get; set; }
    public decimal? Amount { get; set; }
    public string? Note { get; set; }
    public bool CreateExpense { get; set; }
    public int? CategoryId { get; set; }
    public int? PaymentMethodId { get; set; }
}
