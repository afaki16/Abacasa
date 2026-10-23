using Abacasa.Application.Features.ExchangeRates.Commands.DeleteExchangeRate;
using Abacasa.Application.Features.ExchangeRates.Commands.SaveExchangeRate;
using Abacasa.Application.Features.ExchangeRates.Dtos;
using Abacasa.Application.Features.ExchangeRates.Queries.GetExchangeRates;
using Abacasa.Domain.Common.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Abacasa.API.Controllers;

[Authorize]
public class ExchangeRatesController : BaseController
{
    private readonly IMediator _mediator;

    public ExchangeRatesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Latest 20 rates of the current household, newest date first
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "exchangerates.read")]
    [ProducesResponseType(typeof(IEnumerable<ExchangeRateDto>), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> GetExchangeRates([FromQuery] Currency? currency = null)
    {
        var result = await _mediator.Send(new GetExchangeRatesQuery { Currency = currency });
        return HandleResult(result);
    }

    /// <summary>
    /// Save a rate: updates the record of the same currency and date (200) or creates a new one (201). Only USD for now.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "exchangerates.create")]
    [ProducesResponseType(typeof(ExchangeRateDto), 200)]
    [ProducesResponseType(typeof(ExchangeRateDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> SaveExchangeRate([FromBody] SaveExchangeRateDto dto)
    {
        var result = await _mediator.Send(new SaveExchangeRateCommand
        {
            Currency = dto.Currency,
            Rate = dto.Rate,
            Date = dto.Date
        });

        if (!result.IsSuccess)
            return HandleResult(result);

        return StatusCode(result.Value.Created ? 201 : 200, new { success = true, data = result.Value.Rate });
    }

    /// <summary>
    /// Delete a rate (soft delete)
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "exchangerates.delete")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteExchangeRate(int id)
    {
        var result = await _mediator.Send(new DeleteExchangeRateCommand { Id = id });
        return HandleResult(result);
    }
}
