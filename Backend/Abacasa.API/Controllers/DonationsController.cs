using Abacasa.Application.Features.Donations.Commands.CreateDonation;
using Abacasa.Application.Features.Donations.Commands.UpdateDonation;
using Abacasa.Application.Features.Donations.Commands.DeleteDonation;
using Abacasa.Application.Features.Donations.Dtos;
using Abacasa.Application.Features.Donations.Queries.GetAllDonations;
using Abacasa.Application.Features.Donations.Queries.GetDonationById;
using Abacasa.Application.Features.Donations.Queries.GetDonationSummary;
using Abacasa.Domain.Common.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Abacasa.API.Controllers;

[Authorize]
public class DonationsController : BaseController
{
    private readonly IMediator _mediator;

    public DonationsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get donations of the current household with server-side pagination. Dates are inclusive.
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "donations.read")]
    [ProducesResponseType(typeof(IEnumerable<DonationListDto>), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> GetAllDonations(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string searchTerm = null,
        [FromQuery] DateOnly? startDate = null,
        [FromQuery] DateOnly? endDate = null,
        [FromQuery] DonationKind? kind = null,
        [FromQuery] int? fundId = null)
    {
        var query = new GetAllDonationsQuery
        {
            Page = page,
            PageSize = pageSize,
            SearchTerm = searchTerm,
            StartDate = startDate,
            EndDate = endDate,
            Kind = kind,
            FundId = fundId
        };

        var result = await _mediator.Send(query);
        return HandlePagedResult(result);
    }

    /// <summary>
    /// Totals for the same filters as the list (not included in the expense summary)
    /// </summary>
    [HttpGet("summary")]
    [Authorize(Policy = "donations.read")]
    [ProducesResponseType(typeof(DonationSummaryDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> GetDonationSummary(
        [FromQuery] string searchTerm = null,
        [FromQuery] DateOnly? startDate = null,
        [FromQuery] DateOnly? endDate = null,
        [FromQuery] DonationKind? kind = null,
        [FromQuery] int? fundId = null)
    {
        var query = new GetDonationSummaryQuery
        {
            SearchTerm = searchTerm,
            StartDate = startDate,
            EndDate = endDate,
            Kind = kind,
            FundId = fundId
        };

        var result = await _mediator.Send(query);
        return HandleResult(result);
    }

    /// <summary>
    /// Get donation by ID
    /// </summary>
    [HttpGet("{id:int}")]
    [Authorize(Policy = "donations.read")]
    [ProducesResponseType(typeof(DonationDto), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetDonationById(int id)
    {
        var result = await _mediator.Send(new GetDonationByIdQuery { Id = id });
        return HandleResult(result);
    }

    /// <summary>
    /// Create a new donation in the current household
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "donations.create")]
    [ProducesResponseType(typeof(DonationListDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> CreateDonation([FromBody] CreateDonationDto dto)
    {
        var result = await _mediator.Send(new CreateDonationCommand
        {
            Date = dto.Date,
            Amount = dto.Amount,
            Kind = dto.Kind,
            Recipient = dto.Recipient,
            GiverPersonId = dto.GiverPersonId,
            PaymentMethodId = dto.PaymentMethodId,
            Note = dto.Note,
            FundId = dto.FundId
        });

        if (result.IsSuccess)
            return CreatedAtAction(
                nameof(GetDonationById),
                new { id = result.Value.Id },
                new { success = true, data = result.Value });

        return HandleResult(result);
    }

    /// <summary>
    /// Update an existing donation
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Policy = "donations.update")]
    [ProducesResponseType(typeof(DonationListDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateDonation(int id, [FromBody] UpdateDonationDto dto)
    {
        var result = await _mediator.Send(new UpdateDonationCommand
        {
            Id = id,
            Date = dto.Date,
            Amount = dto.Amount,
            Kind = dto.Kind,
            Recipient = dto.Recipient,
            GiverPersonId = dto.GiverPersonId,
            PaymentMethodId = dto.PaymentMethodId,
            Note = dto.Note,
            FundId = dto.FundId
        });
        return HandleResult(result);
    }

    /// <summary>
    /// Delete a donation (soft delete)
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "donations.delete")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteDonation(int id)
    {
        var result = await _mediator.Send(new DeleteDonationCommand { Id = id });
        return HandleResult(result);
    }
}
