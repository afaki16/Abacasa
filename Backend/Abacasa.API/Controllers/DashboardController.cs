using Abacasa.Application.Features.Dashboard.Dtos;
using Abacasa.Application.Features.Dashboard.Queries.GetDashboard;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Abacasa.API.Controllers;

[Authorize]
public class DashboardController : BaseController
{
    private readonly IMediator _mediator;

    public DashboardController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Period summary: realized expenses + donations and unpaid recurring payments (meal card and debts excluded),
    /// breakdowns by payment method and person, debt summary and upcoming payments around today (client's date)
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "dashboard.read")]
    [ProducesResponseType(typeof(DashboardDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> GetDashboard(
        [FromQuery] DateOnly? startDate = null,
        [FromQuery] DateOnly? endDate = null,
        [FromQuery] DateOnly? today = null)
    {
        var result = await _mediator.Send(new GetDashboardQuery
        {
            StartDate = startDate,
            EndDate = endDate,
            Today = today
        });
        return HandleResult(result);
    }
}
