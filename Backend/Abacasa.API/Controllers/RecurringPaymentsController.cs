using Abacasa.Application.Features.RecurringPayments.Commands.CreateRecurringPayment;
using Abacasa.Application.Features.RecurringPayments.Commands.UpdateRecurringPayment;
using Abacasa.Application.Features.RecurringPayments.Commands.DeleteRecurringPayment;
using Abacasa.Application.Features.RecurringPayments.Commands.PayRecurringPayment;
using Abacasa.Application.Features.RecurringPayments.Dtos;
using Abacasa.Application.Features.RecurringPayments.Queries.GetAllRecurringPayments;
using Abacasa.Application.Features.RecurringPayments.Queries.GetRecurringPaymentById;
using Abacasa.Application.Features.RecurringPayments.Queries.GetRecurringPaymentOccurrences;
using Abacasa.Domain.Common.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Abacasa.API.Controllers;

[Authorize]
public class RecurringPaymentsController : BaseController
{
    private readonly IMediator _mediator;

    public RecurringPaymentsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get recurring payment plans of the current household with pagination, ordered by name
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "recurringpayments.read")]
    [ProducesResponseType(typeof(IEnumerable<RecurringPaymentListDto>), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> GetAllRecurringPayments(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string searchTerm = null,
        [FromQuery] RecurringPaymentKind? kind = null,
        [FromQuery] bool? isActive = null)
    {
        var query = new GetAllRecurringPaymentsQuery
        {
            Page = page,
            PageSize = pageSize,
            SearchTerm = searchTerm,
            Kind = kind,
            IsActive = isActive
        };

        var result = await _mediator.Send(query);
        return HandlePagedResult(result);
    }

    /// <summary>
    /// Due occurrences of all plans in the date range (inclusive, max 366 days) with paid/pending totals
    /// </summary>
    [HttpGet("occurrences")]
    [Authorize(Policy = "recurringpayments.read")]
    [ProducesResponseType(typeof(RecurringPaymentOccurrencesDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> GetOccurrences(
        [FromQuery] DateOnly? startDate = null,
        [FromQuery] DateOnly? endDate = null)
    {
        var result = await _mediator.Send(new GetRecurringPaymentOccurrencesQuery
        {
            StartDate = startDate,
            EndDate = endDate
        });
        return HandleResult(result);
    }

    /// <summary>
    /// Get recurring payment plan by ID
    /// </summary>
    [HttpGet("{id:int}")]
    [Authorize(Policy = "recurringpayments.read")]
    [ProducesResponseType(typeof(RecurringPaymentDto), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetRecurringPaymentById(int id)
    {
        var result = await _mediator.Send(new GetRecurringPaymentByIdQuery { Id = id });
        return HandleResult(result);
    }

    /// <summary>
    /// Create a new recurring payment plan in the current household
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "recurringpayments.create")]
    [ProducesResponseType(typeof(RecurringPaymentListDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> CreateRecurringPayment([FromBody] CreateRecurringPaymentDto dto)
    {
        var result = await _mediator.Send(new CreateRecurringPaymentCommand
        {
            Name = dto.Name,
            Kind = dto.Kind,
            ExpectedAmount = dto.ExpectedAmount,
            DueDay = dto.DueDay,
            StartMonth = dto.StartMonth,
            PaymentMethodId = dto.PaymentMethodId,
            CategoryId = dto.CategoryId,
            OwnerPersonId = dto.OwnerPersonId,
            Recipient = dto.Recipient,
            DonationKind = dto.DonationKind,
            TotalAmount = dto.TotalAmount,
            InstallmentCount = dto.InstallmentCount,
            FirstDueDate = dto.FirstDueDate
        });

        if (result.IsSuccess)
            return CreatedAtAction(
                nameof(GetRecurringPaymentById),
                new { id = result.Value.Id },
                new { success = true, data = result.Value });

        return HandleResult(result);
    }

    /// <summary>
    /// Update an existing recurring payment plan
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Policy = "recurringpayments.update")]
    [ProducesResponseType(typeof(RecurringPaymentListDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> UpdateRecurringPayment(int id, [FromBody] UpdateRecurringPaymentDto dto)
    {
        var result = await _mediator.Send(new UpdateRecurringPaymentCommand
        {
            Id = id,
            Name = dto.Name,
            Kind = dto.Kind,
            ExpectedAmount = dto.ExpectedAmount,
            DueDay = dto.DueDay,
            StartMonth = dto.StartMonth,
            PaymentMethodId = dto.PaymentMethodId,
            CategoryId = dto.CategoryId,
            OwnerPersonId = dto.OwnerPersonId,
            Recipient = dto.Recipient,
            DonationKind = dto.DonationKind,
            TotalAmount = dto.TotalAmount,
            InstallmentCount = dto.InstallmentCount,
            FirstDueDate = dto.FirstDueDate,
            IsActive = dto.IsActive
        });
        return HandleResult(result);
    }

    /// <summary>
    /// Delete a recurring payment plan (soft delete). Plans with payments cannot be deleted (409).
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "recurringpayments.delete")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> DeleteRecurringPayment(int id)
    {
        var result = await _mediator.Send(new DeleteRecurringPaymentCommand { Id = id });
        return HandleResult(result);
    }

    /// <summary>
    /// Pay one month of a plan: creates a linked expense (or donation for donation plans)
    /// </summary>
    [HttpPost("{id:int}/pay")]
    [Authorize(Policy = "recurringpaymentpayments.create")]
    [ProducesResponseType(typeof(RecurringPaymentPayResultDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> PayRecurringPayment(int id, [FromBody] PayRecurringPaymentDto dto)
    {
        var result = await _mediator.Send(new PayRecurringPaymentCommand
        {
            Id = id,
            Month = dto.Month,
            Amount = dto.Amount,
            Date = dto.Date
        });

        if (result.IsSuccess)
            return StatusCode(201, new { success = true, data = result.Value });

        return HandleResult(result);
    }
}
