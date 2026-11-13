using Abacasa.Application.Features.Budgets.Commands.CreateBudget;
using Abacasa.Application.Features.Budgets.Commands.DeleteBudget;
using Abacasa.Application.Features.Budgets.Commands.UpdateBudget;
using Abacasa.Application.Features.Budgets.Dtos;
using Abacasa.Application.Features.Budgets.Queries.GetAllBudgets;
using Abacasa.Application.Features.Budgets.Queries.GetBudgetById;
using Abacasa.Application.Features.Budgets.Queries.GetBudgetReport;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Abacasa.API.Controllers;

[Authorize]
public class BudgetsController : BaseController
{
    private readonly IMediator _mediator;

    public BudgetsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get budget records of the current household (household first, then people; newest start first)
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "budgets.read")]
    [ProducesResponseType(typeof(IEnumerable<BudgetDto>), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> GetAllBudgets([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var result = await _mediator.Send(new GetAllBudgetsQuery { Page = page, PageSize = pageSize });
        return HandlePagedResult(result);
    }

    /// <summary>
    /// Budget report of a month: household and per-person budget, used (expenses + unpaid recurring dues, meal card and
    /// donations excluded), remaining, daily allowance for the days left, and a suggestion from the yearly table income
    /// </summary>
    [HttpGet("month/{year:int}/{month:int}")]
    [Authorize(Policy = "budgets.read")]
    [ProducesResponseType(typeof(BudgetReportDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> GetBudgetReport(int year, int month, [FromQuery] DateOnly? today = null)
    {
        var result = await _mediator.Send(new GetBudgetReportQuery { Year = year, Month = month, Today = today });
        return HandleResult(result);
    }

    /// <summary>
    /// Get budget record by ID
    /// </summary>
    [HttpGet("{id:int}")]
    [Authorize(Policy = "budgets.read")]
    [ProducesResponseType(typeof(BudgetDto), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetBudgetById(int id)
    {
        var result = await _mediator.Send(new GetBudgetByIdQuery { Id = id });
        return HandleResult(result);
    }

    /// <summary>
    /// Create a budget valid from its start month; one record per (person, start month), household included (409).
    /// Amount 0 ends the budget from that month
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "budgets.create")]
    [ProducesResponseType(typeof(BudgetDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> CreateBudget([FromBody] CreateBudgetDto dto)
    {
        var result = await _mediator.Send(new CreateBudgetCommand
        {
            OwnerPersonId = dto.OwnerPersonId,
            StartYear = dto.StartYear,
            StartMonth = dto.StartMonth,
            Amount = dto.Amount,
            Note = dto.Note
        });

        if (result.IsSuccess)
            return CreatedAtAction(
                nameof(GetBudgetById),
                new { id = result.Value.Id },
                new { success = true, data = result.Value });

        return HandleResult(result);
    }

    /// <summary>
    /// Update a budget record
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Policy = "budgets.update")]
    [ProducesResponseType(typeof(BudgetDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> UpdateBudget(int id, [FromBody] UpdateBudgetDto dto)
    {
        var result = await _mediator.Send(new UpdateBudgetCommand
        {
            Id = id,
            OwnerPersonId = dto.OwnerPersonId,
            StartYear = dto.StartYear,
            StartMonth = dto.StartMonth,
            Amount = dto.Amount,
            Note = dto.Note
        });
        return HandleResult(result);
    }

    /// <summary>
    /// Delete a budget record (soft delete); the owner's previous record applies again
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "budgets.delete")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteBudget(int id)
    {
        var result = await _mediator.Send(new DeleteBudgetCommand { Id = id });
        return HandleResult(result);
    }
}
