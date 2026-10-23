using Abacasa.Application.Features.Vehicles.Commands.CreateVehicle;
using Abacasa.Application.Features.Vehicles.Commands.CreateVehicleObligation;
using Abacasa.Application.Features.Vehicles.Commands.DeleteVehicle;
using Abacasa.Application.Features.Vehicles.Commands.DeleteVehicleObligation;
using Abacasa.Application.Features.Vehicles.Commands.UpdateVehicle;
using Abacasa.Application.Features.Vehicles.Commands.UpdateVehicleObligation;
using Abacasa.Application.Features.Vehicles.Dtos;
using Abacasa.Application.Features.Vehicles.Queries.GetAllVehicles;
using Abacasa.Application.Features.Vehicles.Queries.GetVehicleById;
using Abacasa.Application.Features.Vehicles.Queries.GetVehicleObligations;
using Abacasa.Application.Features.Vehicles.Queries.GetVehicleReminders;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Abacasa.API.Controllers;

[Authorize]
public class VehiclesController : BaseController
{
    private readonly IMediator _mediator;

    public VehiclesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get vehicles of the current household with pagination, ordered by name; each with its current record per type
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "vehicles.read")]
    [ProducesResponseType(typeof(IEnumerable<VehicleDto>), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> GetAllVehicles(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string searchTerm = null,
        [FromQuery] bool? isActive = null)
    {
        var result = await _mediator.Send(new GetAllVehiclesQuery
        {
            Page = page,
            PageSize = pageSize,
            SearchTerm = searchTerm,
            IsActive = isActive
        });
        return HandlePagedResult(result);
    }

    /// <summary>
    /// Reminders: current records of active vehicles valid until today + 30 days or overdue, ordered by valid-until
    /// </summary>
    [HttpGet("upcoming")]
    [Authorize(Policy = "vehicles.read")]
    [ProducesResponseType(typeof(IEnumerable<VehicleReminderDto>), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> GetVehicleReminders([FromQuery] DateOnly? today = null)
    {
        var result = await _mediator.Send(new GetVehicleRemindersQuery { Today = today });
        return HandleResult(result);
    }

    /// <summary>
    /// Get vehicle by ID
    /// </summary>
    [HttpGet("{id:int}")]
    [Authorize(Policy = "vehicles.read")]
    [ProducesResponseType(typeof(VehicleDto), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetVehicleById(int id)
    {
        var result = await _mediator.Send(new GetVehicleByIdQuery { Id = id });
        return HandleResult(result);
    }

    /// <summary>
    /// Create a vehicle; plate is stored upper case and must be unique in the household (409)
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "vehicles.create")]
    [ProducesResponseType(typeof(VehicleDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> CreateVehicle([FromBody] CreateVehicleDto dto)
    {
        var result = await _mediator.Send(new CreateVehicleCommand
        {
            Name = dto.Name,
            Plate = dto.Plate,
            OwnerPersonId = dto.OwnerPersonId,
            Note = dto.Note
        });

        if (result.IsSuccess)
            return CreatedAtAction(
                nameof(GetVehicleById),
                new { id = result.Value.Id },
                new { success = true, data = result.Value });

        return HandleResult(result);
    }

    /// <summary>
    /// Update a vehicle
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Policy = "vehicles.update")]
    [ProducesResponseType(typeof(VehicleDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> UpdateVehicle(int id, [FromBody] UpdateVehicleDto dto)
    {
        var result = await _mediator.Send(new UpdateVehicleCommand
        {
            Id = id,
            Name = dto.Name,
            Plate = dto.Plate,
            OwnerPersonId = dto.OwnerPersonId,
            IsActive = dto.IsActive,
            Note = dto.Note
        });
        return HandleResult(result);
    }

    /// <summary>
    /// Delete a vehicle (soft delete). Vehicles with records cannot be deleted (409).
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "vehicles.delete")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> DeleteVehicle(int id)
    {
        var result = await _mediator.Send(new DeleteVehicleCommand { Id = id });
        return HandleResult(result);
    }

    /// <summary>
    /// Records (insurance, inspection, tax) of a vehicle, latest valid-until first
    /// </summary>
    [HttpGet("{id:int}/obligations")]
    [Authorize(Policy = "vehicles.read")]
    [ProducesResponseType(typeof(IEnumerable<VehicleObligationDto>), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetVehicleObligations(int id)
    {
        var result = await _mediator.Send(new GetVehicleObligationsQuery { VehicleId = id });
        return HandleResult(result);
    }

    /// <summary>
    /// Add a record; with CreateExpense a linked expense is created in the same save
    /// </summary>
    [HttpPost("{id:int}/obligations")]
    [Authorize(Policy = "vehicles.update")]
    [ProducesResponseType(typeof(VehicleObligationDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> CreateVehicleObligation(int id, [FromBody] SaveVehicleObligationDto dto)
    {
        var result = await _mediator.Send(new CreateVehicleObligationCommand
        {
            VehicleId = id,
            Type = dto.Type,
            Date = dto.Date,
            ValidUntil = dto.ValidUntil,
            Amount = dto.Amount,
            Note = dto.Note,
            CreateExpense = dto.CreateExpense,
            CategoryId = dto.CategoryId,
            PaymentMethodId = dto.PaymentMethodId
        });

        if (result.IsSuccess)
            return StatusCode(201, new { success = true, data = result.Value });

        return HandleResult(result);
    }

    /// <summary>
    /// Update a record; a live linked expense follows its date and amount
    /// </summary>
    [HttpPut("{id:int}/obligations/{obligationId:int}")]
    [Authorize(Policy = "vehicles.update")]
    [ProducesResponseType(typeof(VehicleObligationDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateVehicleObligation(int id, int obligationId, [FromBody] SaveVehicleObligationDto dto)
    {
        var result = await _mediator.Send(new UpdateVehicleObligationCommand
        {
            VehicleId = id,
            ObligationId = obligationId,
            Type = dto.Type,
            Date = dto.Date,
            ValidUntil = dto.ValidUntil,
            Amount = dto.Amount,
            Note = dto.Note,
            CreateExpense = dto.CreateExpense,
            CategoryId = dto.CategoryId,
            PaymentMethodId = dto.PaymentMethodId
        });
        return HandleResult(result);
    }

    /// <summary>
    /// Delete a record (soft delete); a live linked expense is deleted too
    /// </summary>
    [HttpDelete("{id:int}/obligations/{obligationId:int}")]
    [Authorize(Policy = "vehicles.update")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteVehicleObligation(int id, int obligationId)
    {
        var result = await _mediator.Send(new DeleteVehicleObligationCommand { VehicleId = id, ObligationId = obligationId });
        return HandleResult(result);
    }
}
