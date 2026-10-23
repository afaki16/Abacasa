using Abacasa.Application.Features.Ledger.Commands.CreateLedgerItem;
using Abacasa.Application.Features.Ledger.Commands.DeleteLedgerItem;
using Abacasa.Application.Features.Ledger.Commands.SetMonthlyAmount;
using Abacasa.Application.Features.Ledger.Commands.UpdateLedgerItem;
using Abacasa.Application.Features.Ledger.Dtos;
using Abacasa.Application.Features.Ledger.Queries.GetAllLedgerItems;
using Abacasa.Application.Features.Ledger.Queries.GetLedgerItemById;
using Abacasa.Application.Features.Ledger.Queries.GetLedgerYear;
using Abacasa.Domain.Common.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Abacasa.API.Controllers;

[Authorize]
public class LedgerController : BaseController
{
    private readonly IMediator _mediator;

    public LedgerController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get income/expense items of the current household with pagination, ordered by name
    /// </summary>
    [HttpGet("items")]
    [Authorize(Policy = "ledger.read")]
    [ProducesResponseType(typeof(IEnumerable<LedgerItemListDto>), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> GetAllLedgerItems(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string searchTerm = null,
        [FromQuery] LedgerDirection? direction = null,
        [FromQuery] bool? isActive = null)
    {
        var query = new GetAllLedgerItemsQuery
        {
            Page = page,
            PageSize = pageSize,
            SearchTerm = searchTerm,
            Direction = direction,
            IsActive = isActive
        };

        var result = await _mediator.Send(query);
        return HandlePagedResult(result);
    }

    /// <summary>
    /// Get income/expense item by ID
    /// </summary>
    [HttpGet("items/{id:int}")]
    [Authorize(Policy = "ledger.read")]
    [ProducesResponseType(typeof(LedgerItemDto), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetLedgerItemById(int id)
    {
        var result = await _mediator.Send(new GetLedgerItemByIdQuery { Id = id });
        return HandleResult(result);
    }

    /// <summary>
    /// Create a new income/expense item in the current household
    /// </summary>
    [HttpPost("items")]
    [Authorize(Policy = "ledger.create")]
    [ProducesResponseType(typeof(LedgerItemListDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> CreateLedgerItem([FromBody] CreateLedgerItemDto dto)
    {
        var result = await _mediator.Send(new CreateLedgerItemCommand
        {
            Name = dto.Name,
            Direction = dto.Direction,
            OwnerPersonId = dto.OwnerPersonId
        });

        if (result.IsSuccess)
            return CreatedAtAction(
                nameof(GetLedgerItemById),
                new { id = result.Value.Id },
                new { success = true, data = result.Value });

        return HandleResult(result);
    }

    /// <summary>
    /// Update an existing income/expense item. Direction cannot change while the item has amounts (400).
    /// </summary>
    [HttpPut("items/{id:int}")]
    [Authorize(Policy = "ledger.update")]
    [ProducesResponseType(typeof(LedgerItemListDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> UpdateLedgerItem(int id, [FromBody] UpdateLedgerItemDto dto)
    {
        var result = await _mediator.Send(new UpdateLedgerItemCommand
        {
            Id = id,
            Name = dto.Name,
            Direction = dto.Direction,
            OwnerPersonId = dto.OwnerPersonId,
            IsActive = dto.IsActive
        });
        return HandleResult(result);
    }

    /// <summary>
    /// Delete an income/expense item (soft delete). Items with amounts cannot be deleted (409).
    /// </summary>
    [HttpDelete("items/{id:int}")]
    [Authorize(Policy = "ledger.delete")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> DeleteLedgerItem(int id)
    {
        var result = await _mediator.Send(new DeleteLedgerItemCommand { Id = id });
        return HandleResult(result);
    }

    /// <summary>
    /// Write one month of an item: a number creates (201) or updates (200) the cell, null clears it (200).
    /// Works on inactive items too.
    /// </summary>
    [HttpPut("items/{id:int}/amounts/{year:int}/{month:int}")]
    [Authorize(Policy = "ledger.update")]
    [ProducesResponseType(typeof(MonthlyAmountDto), 200)]
    [ProducesResponseType(typeof(MonthlyAmountDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> SetMonthlyAmount(int id, int year, int month, [FromBody] SetMonthlyAmountDto dto)
    {
        var result = await _mediator.Send(new SetMonthlyAmountCommand
        {
            LedgerItemId = id,
            Year = year,
            Month = month,
            Amount = dto.Amount
        });

        if (!result.IsSuccess)
            return HandleResult(result);

        return StatusCode(result.Value.Created ? 201 : 200, new { success = true, data = result.Value.Cell });
    }

    /// <summary>
    /// Calendar year table: manual income rows; expense rows from plan payments (by due month),
    /// unplanned expenses by category and unplanned donations (by record month), and manual expense rows. Meal card excluded.
    /// </summary>
    [HttpGet("year/{year:int}")]
    [Authorize(Policy = "ledger.read")]
    [ProducesResponseType(typeof(LedgerYearDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> GetLedgerYear(int year)
    {
        var result = await _mediator.Send(new GetLedgerYearQuery { Year = year });
        return HandleResult(result);
    }
}
