using Abacasa.Application.Features.Debts.Commands.CreateDebt;
using Abacasa.Application.Features.Debts.Commands.UpdateDebt;
using Abacasa.Application.Features.Debts.Commands.DeleteDebt;
using Abacasa.Application.Features.Debts.Commands.CreateDebtPayment;
using Abacasa.Application.Features.Debts.Commands.UpdateDebtPayment;
using Abacasa.Application.Features.Debts.Commands.DeleteDebtPayment;
using Abacasa.Application.Features.Debts.Dtos;
using Abacasa.Application.Features.Debts.Queries.GetAllDebts;
using Abacasa.Application.Features.Debts.Queries.GetDebtById;
using Abacasa.Application.Features.Debts.Queries.GetDebtPayments;
using Abacasa.Application.Features.Debts.Queries.GetDebtSummary;
using Abacasa.Domain.Common.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Abacasa.API.Controllers;

[Authorize]
public class DebtsController : BaseController
{
    private readonly IMediator _mediator;

    public DebtsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get debts of the current household with pagination, ordered by date (newest first)
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "debts.read")]
    [ProducesResponseType(typeof(IEnumerable<DebtListDto>), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> GetAllDebts(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string searchTerm = null,
        [FromQuery] bool? isClosed = null,
        [FromQuery] int? creditorPersonId = null,
        [FromQuery] Currency? currency = null)
    {
        var query = new GetAllDebtsQuery
        {
            Page = page,
            PageSize = pageSize,
            SearchTerm = searchTerm,
            IsClosed = isClosed,
            CreditorPersonId = creditorPersonId,
            Currency = currency
        };

        var result = await _mediator.Send(query);
        return HandlePagedResult(result);
    }

    /// <summary>
    /// Open debt totals (TRY, USD and TRY equivalent with the latest rate), paid total and totals by creditor
    /// </summary>
    [HttpGet("summary")]
    [Authorize(Policy = "debts.read")]
    [ProducesResponseType(typeof(DebtSummaryDto), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> GetDebtSummary()
    {
        var result = await _mediator.Send(new GetDebtSummaryQuery());
        return HandleResult(result);
    }

    /// <summary>
    /// Get debt by ID
    /// </summary>
    [HttpGet("{id:int}")]
    [Authorize(Policy = "debts.read")]
    [ProducesResponseType(typeof(DebtDto), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetDebtById(int id)
    {
        var result = await _mediator.Send(new GetDebtByIdQuery { Id = id });
        return HandleResult(result);
    }

    /// <summary>
    /// Create a new debt in the current household
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "debts.create")]
    [ProducesResponseType(typeof(DebtListDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> CreateDebt([FromBody] CreateDebtDto dto)
    {
        var result = await _mediator.Send(new CreateDebtCommand
        {
            CreditorPersonId = dto.CreditorPersonId,
            DebtorPersonId = dto.DebtorPersonId,
            Currency = dto.Currency,
            Amount = dto.Amount,
            Date = dto.Date,
            Note = dto.Note
        });

        if (result.IsSuccess)
            return CreatedAtAction(
                nameof(GetDebtById),
                new { id = result.Value.Id },
                new { success = true, data = result.Value });

        return HandleResult(result);
    }

    /// <summary>
    /// Update an existing debt
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Policy = "debts.update")]
    [ProducesResponseType(typeof(DebtListDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateDebt(int id, [FromBody] UpdateDebtDto dto)
    {
        var result = await _mediator.Send(new UpdateDebtCommand
        {
            Id = id,
            CreditorPersonId = dto.CreditorPersonId,
            DebtorPersonId = dto.DebtorPersonId,
            Currency = dto.Currency,
            Amount = dto.Amount,
            Date = dto.Date,
            Note = dto.Note
        });
        return HandleResult(result);
    }

    /// <summary>
    /// Delete a debt (soft delete). Debts with payments cannot be deleted (409).
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "debts.delete")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> DeleteDebt(int id)
    {
        var result = await _mediator.Send(new DeleteDebtCommand { Id = id });
        return HandleResult(result);
    }

    /// <summary>
    /// Payments of a debt, ordered by date
    /// </summary>
    [HttpGet("{id:int}/payments")]
    [Authorize(Policy = "debts.read")]
    [ProducesResponseType(typeof(IEnumerable<DebtPaymentDto>), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetDebtPayments(int id)
    {
        var result = await _mediator.Send(new GetDebtPaymentsQuery { DebtId = id });
        return HandleResult(result);
    }

    /// <summary>
    /// Add a payment to a debt
    /// </summary>
    [HttpPost("{id:int}/payments")]
    [Authorize(Policy = "debts.update")]
    [ProducesResponseType(typeof(DebtPaymentDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> CreateDebtPayment(int id, [FromBody] SaveDebtPaymentDto dto)
    {
        var result = await _mediator.Send(new CreateDebtPaymentCommand
        {
            DebtId = id,
            Date = dto.Date,
            Amount = dto.Amount,
            ExchangeRate = dto.ExchangeRate,
            Note = dto.Note
        });

        if (result.IsSuccess)
            return StatusCode(201, new { success = true, data = result.Value });

        return HandleResult(result);
    }

    /// <summary>
    /// Update a payment of a debt
    /// </summary>
    [HttpPut("{id:int}/payments/{paymentId:int}")]
    [Authorize(Policy = "debts.update")]
    [ProducesResponseType(typeof(DebtPaymentDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateDebtPayment(int id, int paymentId, [FromBody] SaveDebtPaymentDto dto)
    {
        var result = await _mediator.Send(new UpdateDebtPaymentCommand
        {
            DebtId = id,
            PaymentId = paymentId,
            Date = dto.Date,
            Amount = dto.Amount,
            ExchangeRate = dto.ExchangeRate,
            Note = dto.Note
        });
        return HandleResult(result);
    }

    /// <summary>
    /// Delete a payment of a debt (soft delete)
    /// </summary>
    [HttpDelete("{id:int}/payments/{paymentId:int}")]
    [Authorize(Policy = "debts.update")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteDebtPayment(int id, int paymentId)
    {
        var result = await _mediator.Send(new DeleteDebtPaymentCommand { DebtId = id, PaymentId = paymentId });
        return HandleResult(result);
    }
}
