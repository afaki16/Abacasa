using Abacasa.Application.Features.DonationTargets.Commands.CreateDonationTarget;
using Abacasa.Application.Features.DonationTargets.Commands.DeleteDonationTarget;
using Abacasa.Application.Features.DonationTargets.Commands.UpdateDonationTarget;
using Abacasa.Application.Features.DonationTargets.Dtos;
using Abacasa.Application.Features.DonationTargets.Queries.GetAllDonationTargets;
using Abacasa.Application.Features.DonationTargets.Queries.GetDonationTargetById;
using Abacasa.Application.Features.DonationTargets.Queries.GetDonationTargetReport;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Abacasa.API.Controllers;

[Authorize]
public class DonationTargetsController : BaseController
{
    private readonly IMediator _mediator;

    public DonationTargetsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get donation targets of the current household with pagination; optional year filter
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "donationtargets.read")]
    [ProducesResponseType(typeof(IEnumerable<DonationTargetDto>), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> GetAllDonationTargets(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] int? year = null)
    {
        var result = await _mediator.Send(new GetAllDonationTargetsQuery { Page = page, PageSize = pageSize, Year = year });
        return HandlePagedResult(result);
    }

    /// <summary>
    /// Target report of a year: given, planned (unpaid donation plan dues from today to year end) and remaining per target,
    /// totals by kind and voluntary donations. Fund distributions are excluded.
    /// </summary>
    [HttpGet("year/{year:int}")]
    [Authorize(Policy = "donationtargets.read")]
    [ProducesResponseType(typeof(DonationTargetReportDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> GetDonationTargetReport(int year, [FromQuery] DateOnly? today = null)
    {
        var result = await _mediator.Send(new GetDonationTargetReportQuery { Year = year, Today = today });
        return HandleResult(result);
    }

    /// <summary>
    /// Get donation target by ID
    /// </summary>
    [HttpGet("{id:int}")]
    [Authorize(Policy = "donationtargets.read")]
    [ProducesResponseType(typeof(DonationTargetDto), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetDonationTargetById(int id)
    {
        var result = await _mediator.Send(new GetDonationTargetByIdQuery { Id = id });
        return HandleResult(result);
    }

    /// <summary>
    /// Create a donation target; one target per (person, year, kind), household included (409)
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "donationtargets.create")]
    [ProducesResponseType(typeof(DonationTargetDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> CreateDonationTarget([FromBody] CreateDonationTargetDto dto)
    {
        var result = await _mediator.Send(new CreateDonationTargetCommand
        {
            OwnerPersonId = dto.OwnerPersonId,
            Year = dto.Year,
            Kind = dto.Kind,
            Amount = dto.Amount,
            Note = dto.Note
        });

        if (result.IsSuccess)
            return CreatedAtAction(
                nameof(GetDonationTargetById),
                new { id = result.Value.Id },
                new { success = true, data = result.Value });

        return HandleResult(result);
    }

    /// <summary>
    /// Update a donation target
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Policy = "donationtargets.update")]
    [ProducesResponseType(typeof(DonationTargetDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> UpdateDonationTarget(int id, [FromBody] UpdateDonationTargetDto dto)
    {
        var result = await _mediator.Send(new UpdateDonationTargetCommand
        {
            Id = id,
            OwnerPersonId = dto.OwnerPersonId,
            Year = dto.Year,
            Kind = dto.Kind,
            Amount = dto.Amount,
            Note = dto.Note
        });
        return HandleResult(result);
    }

    /// <summary>
    /// Delete a donation target (soft delete)
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "donationtargets.delete")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteDonationTarget(int id)
    {
        var result = await _mediator.Send(new DeleteDonationTargetCommand { Id = id });
        return HandleResult(result);
    }
}
