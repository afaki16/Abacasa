using Abacasa.Application.Features.PaymentMethods.Commands.CreatePaymentMethod;
using Abacasa.Application.Features.PaymentMethods.Commands.UpdatePaymentMethod;
using Abacasa.Application.Features.PaymentMethods.Commands.DeletePaymentMethod;
using Abacasa.Application.Features.PaymentMethods.Dtos;
using Abacasa.Application.Features.PaymentMethods.Queries.GetAllPaymentMethods;
using Abacasa.Application.Features.PaymentMethods.Queries.GetPaymentMethodById;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Abacasa.API.Controllers;

[Authorize]
public class PaymentMethodsController : BaseController
{
    private readonly IMediator _mediator;

    public PaymentMethodsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get all payment methods of the current household with pagination
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "paymentmethods.read")]
    [ProducesResponseType(typeof(IEnumerable<PaymentMethodListDto>), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> GetAllPaymentMethods(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string searchTerm = null,
        [FromQuery] bool? isActive = null)
    {
        var query = new GetAllPaymentMethodsQuery
        {
            Page = page,
            PageSize = pageSize,
            SearchTerm = searchTerm,
            IsActive = isActive
        };

        var result = await _mediator.Send(query);
        return HandlePagedResult(result);
    }

    /// <summary>
    /// Get payment method by ID
    /// </summary>
    [HttpGet("{id:int}")]
    [Authorize(Policy = "paymentmethods.read")]
    [ProducesResponseType(typeof(PaymentMethodDto), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetPaymentMethodById(int id)
    {
        var result = await _mediator.Send(new GetPaymentMethodByIdQuery { Id = id });
        return HandleResult(result);
    }

    /// <summary>
    /// Create a new payment method in the current household
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "paymentmethods.create")]
    [ProducesResponseType(typeof(PaymentMethodListDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> CreatePaymentMethod([FromBody] CreatePaymentMethodDto dto)
    {
        var result = await _mediator.Send(new CreatePaymentMethodCommand
        {
            Name = dto.Name,
            Type = dto.Type,
            Bank = dto.Bank,
            OwnerPersonId = dto.OwnerPersonId,
            StatementDay = dto.StatementDay,
            IsActive = dto.IsActive
        });

        if (result.IsSuccess)
            return CreatedAtAction(
                nameof(GetPaymentMethodById),
                new { id = result.Value.Id },
                new { success = true, data = result.Value });

        return HandleResult(result);
    }

    /// <summary>
    /// Update an existing payment method
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Policy = "paymentmethods.update")]
    [ProducesResponseType(typeof(PaymentMethodListDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdatePaymentMethod(int id, [FromBody] UpdatePaymentMethodDto dto)
    {
        var result = await _mediator.Send(new UpdatePaymentMethodCommand
        {
            Id = id,
            Name = dto.Name,
            Type = dto.Type,
            Bank = dto.Bank,
            OwnerPersonId = dto.OwnerPersonId,
            StatementDay = dto.StatementDay,
            IsActive = dto.IsActive
        });
        return HandleResult(result);
    }

    /// <summary>
    /// Delete a payment method (soft delete)
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "paymentmethods.delete")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeletePaymentMethod(int id)
    {
        var result = await _mediator.Send(new DeletePaymentMethodCommand { Id = id });
        return HandleResult(result);
    }
}
