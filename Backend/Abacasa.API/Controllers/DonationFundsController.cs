using Abacasa.Application.Features.DonationFunds.Commands.CreateDonationFund;
using Abacasa.Application.Features.DonationFunds.Commands.CreateFundMovement;
using Abacasa.Application.Features.DonationFunds.Commands.DeleteDonationFund;
using Abacasa.Application.Features.DonationFunds.Commands.DeleteFundMovement;
using Abacasa.Application.Features.DonationFunds.Commands.UpdateDonationFund;
using Abacasa.Application.Features.DonationFunds.Commands.UpdateFundMovement;
using Abacasa.Application.Features.DonationFunds.Dtos;
using Abacasa.Application.Features.DonationFunds.Queries.GetAllDonationFunds;
using Abacasa.Application.Features.DonationFunds.Queries.GetDonationFundById;
using Abacasa.Application.Features.DonationFunds.Queries.GetFundMovements;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Abacasa.API.Controllers;

[Authorize]
public class DonationFundsController : BaseController
{
    private readonly IMediator _mediator;

    public DonationFundsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get funds (money given to distribute) of the current household with pagination, newest first.
    /// isClosed: remaining (amount − distributed) == 0
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "donationfunds.read")]
    [ProducesResponseType(typeof(IEnumerable<DonationFundDto>), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> GetAllDonationFunds(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string searchTerm = null,
        [FromQuery] bool? isClosed = null)
    {
        var result = await _mediator.Send(new GetAllDonationFundsQuery
        {
            Page = page,
            PageSize = pageSize,
            SearchTerm = searchTerm,
            IsClosed = isClosed
        });
        return HandlePagedResult(result);
    }

    /// <summary>
    /// Get fund by ID
    /// </summary>
    [HttpGet("{id:int}")]
    [Authorize(Policy = "donationfunds.read")]
    [ProducesResponseType(typeof(DonationFundDto), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetDonationFundById(int id)
    {
        var result = await _mediator.Send(new GetDonationFundByIdQuery { Id = id });
        return HandleResult(result);
    }

    /// <summary>
    /// Create a fund in the current household
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "donationfunds.create")]
    [ProducesResponseType(typeof(DonationFundDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> CreateDonationFund([FromBody] CreateDonationFundDto dto)
    {
        var result = await _mediator.Send(new CreateDonationFundCommand
        {
            FromPersonId = dto.FromPersonId,
            Kind = dto.Kind,
            Amount = dto.Amount,
            Date = dto.Date,
            Note = dto.Note
        });

        if (result.IsSuccess)
            return CreatedAtAction(
                nameof(GetDonationFundById),
                new { id = result.Value.Id },
                new { success = true, data = result.Value });

        return HandleResult(result);
    }

    /// <summary>
    /// Update a fund. Amount cannot go below distributed + in use; kind is locked while it has distributions (400).
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Policy = "donationfunds.update")]
    [ProducesResponseType(typeof(DonationFundDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateDonationFund(int id, [FromBody] UpdateDonationFundDto dto)
    {
        var result = await _mediator.Send(new UpdateDonationFundCommand
        {
            Id = id,
            FromPersonId = dto.FromPersonId,
            Kind = dto.Kind,
            Amount = dto.Amount,
            Date = dto.Date,
            Note = dto.Note
        });
        return HandleResult(result);
    }

    /// <summary>
    /// Delete a fund (soft delete). Funds with distributions or movements cannot be deleted (409).
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "donationfunds.delete")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> DeleteDonationFund(int id)
    {
        var result = await _mediator.Send(new DeleteDonationFundCommand { Id = id });
        return HandleResult(result);
    }

    /// <summary>
    /// Movements (temporary use / return) of a fund, ordered by date
    /// </summary>
    [HttpGet("{id:int}/movements")]
    [Authorize(Policy = "donationfunds.read")]
    [ProducesResponseType(typeof(IEnumerable<FundMovementDto>), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetFundMovements(int id)
    {
        var result = await _mediator.Send(new GetFundMovementsQuery { FundId = id });
        return HandleResult(result);
    }

    /// <summary>
    /// Add a movement; in use and on hand must stay ≥ 0 (400)
    /// </summary>
    [HttpPost("{id:int}/movements")]
    [Authorize(Policy = "donationfunds.update")]
    [ProducesResponseType(typeof(FundMovementDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> CreateFundMovement(int id, [FromBody] SaveFundMovementDto dto)
    {
        var result = await _mediator.Send(new CreateFundMovementCommand
        {
            FundId = id,
            Type = dto.Type,
            Date = dto.Date,
            Amount = dto.Amount,
            Note = dto.Note
        });

        if (result.IsSuccess)
            return StatusCode(201, new { success = true, data = result.Value });

        return HandleResult(result);
    }

    /// <summary>
    /// Update a movement of the fund
    /// </summary>
    [HttpPut("{id:int}/movements/{movementId:int}")]
    [Authorize(Policy = "donationfunds.update")]
    [ProducesResponseType(typeof(FundMovementDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateFundMovement(int id, int movementId, [FromBody] SaveFundMovementDto dto)
    {
        var result = await _mediator.Send(new UpdateFundMovementCommand
        {
            FundId = id,
            MovementId = movementId,
            Type = dto.Type,
            Date = dto.Date,
            Amount = dto.Amount,
            Note = dto.Note
        });
        return HandleResult(result);
    }

    /// <summary>
    /// Delete a movement of the fund (soft delete); in use and on hand must stay ≥ 0 (400)
    /// </summary>
    [HttpDelete("{id:int}/movements/{movementId:int}")]
    [Authorize(Policy = "donationfunds.update")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteFundMovement(int id, int movementId)
    {
        var result = await _mediator.Send(new DeleteFundMovementCommand { FundId = id, MovementId = movementId });
        return HandleResult(result);
    }
}
