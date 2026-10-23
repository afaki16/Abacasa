using Abacasa.Application.Features.Households.Commands.CreateHousehold;
using Abacasa.Application.Features.Households.Dtos;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Abacasa.API.Controllers;

[Authorize]
public class HouseholdsController : BaseController
{
    private readonly IMediator _mediator;

    public HouseholdsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Create a household: the caller becomes its admin; a person for the caller and default categories are added.
    /// No permission is required (any signed-in user). At most 10 live admin memberships per user (400).
    /// The active household does not change; switch with POST /api/auth/switch-household.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(HouseholdDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> CreateHousehold([FromBody] CreateHouseholdDto dto)
    {
        var result = await _mediator.Send(new CreateHouseholdCommand { Name = dto.Name });

        if (result.IsSuccess)
            return StatusCode(201, new { success = true, data = result.Value });

        return HandleResult(result);
    }
}
