using Abacasa.Application.Features.Expenses.Commands.CreateExpense;
using Abacasa.Application.Features.Expenses.Commands.UpdateExpense;
using Abacasa.Application.Features.Expenses.Commands.DeleteExpense;
using Abacasa.Application.Features.Expenses.Dtos;
using Abacasa.Application.Features.Expenses.Queries.GetAllExpenses;
using Abacasa.Application.Features.Expenses.Queries.GetExpenseById;
using Abacasa.Application.Features.Expenses.Queries.GetExpenseSummary;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Abacasa.API.Controllers;

[Authorize]
public class ExpensesController : BaseController
{
    private readonly IMediator _mediator;

    public ExpensesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get expenses of the current household with server-side pagination. Dates are inclusive.
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "expenses.read")]
    [ProducesResponseType(typeof(IEnumerable<ExpenseListDto>), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> GetAllExpenses(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string searchTerm = null,
        [FromQuery] DateOnly? startDate = null,
        [FromQuery] DateOnly? endDate = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] int? paymentMethodId = null,
        [FromQuery] int? ownerPersonId = null)
    {
        var query = new GetAllExpensesQuery
        {
            Page = page,
            PageSize = pageSize,
            SearchTerm = searchTerm,
            StartDate = startDate,
            EndDate = endDate,
            CategoryId = categoryId,
            PaymentMethodId = paymentMethodId,
            OwnerPersonId = ownerPersonId
        };

        var result = await _mediator.Send(query);
        return HandlePagedResult(result);
    }

    /// <summary>
    /// Totals for the same filters as the list (meal card excluded from total and byCategory)
    /// </summary>
    [HttpGet("summary")]
    [Authorize(Policy = "expenses.read")]
    [ProducesResponseType(typeof(ExpenseSummaryDto), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> GetExpenseSummary(
        [FromQuery] string searchTerm = null,
        [FromQuery] DateOnly? startDate = null,
        [FromQuery] DateOnly? endDate = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] int? paymentMethodId = null,
        [FromQuery] int? ownerPersonId = null)
    {
        var query = new GetExpenseSummaryQuery
        {
            SearchTerm = searchTerm,
            StartDate = startDate,
            EndDate = endDate,
            CategoryId = categoryId,
            PaymentMethodId = paymentMethodId,
            OwnerPersonId = ownerPersonId
        };

        var result = await _mediator.Send(query);
        return HandleResult(result);
    }

    /// <summary>
    /// Get expense by ID
    /// </summary>
    [HttpGet("{id:int}")]
    [Authorize(Policy = "expenses.read")]
    [ProducesResponseType(typeof(ExpenseDto), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetExpenseById(int id)
    {
        var result = await _mediator.Send(new GetExpenseByIdQuery { Id = id });
        return HandleResult(result);
    }

    /// <summary>
    /// Create a new expense in the current household
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "expenses.create")]
    [ProducesResponseType(typeof(ExpenseListDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> CreateExpense([FromBody] CreateExpenseDto dto)
    {
        var result = await _mediator.Send(new CreateExpenseCommand
        {
            Date = dto.Date,
            Amount = dto.Amount,
            Description = dto.Description,
            CategoryId = dto.CategoryId,
            PaymentMethodId = dto.PaymentMethodId,
            OwnerPersonId = dto.OwnerPersonId
        });

        if (result.IsSuccess)
            return CreatedAtAction(
                nameof(GetExpenseById),
                new { id = result.Value.Id },
                new { success = true, data = result.Value });

        return HandleResult(result);
    }

    /// <summary>
    /// Update an existing expense
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Policy = "expenses.update")]
    [ProducesResponseType(typeof(ExpenseListDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateExpense(int id, [FromBody] UpdateExpenseDto dto)
    {
        var result = await _mediator.Send(new UpdateExpenseCommand
        {
            Id = id,
            Date = dto.Date,
            Amount = dto.Amount,
            Description = dto.Description,
            CategoryId = dto.CategoryId,
            PaymentMethodId = dto.PaymentMethodId,
            OwnerPersonId = dto.OwnerPersonId
        });
        return HandleResult(result);
    }

    /// <summary>
    /// Delete an expense (soft delete)
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "expenses.delete")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteExpense(int id)
    {
        var result = await _mediator.Send(new DeleteExpenseCommand { Id = id });
        return HandleResult(result);
    }
}
