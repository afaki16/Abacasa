using Abacasa.Application.Features.Legal.Dtos;
using Abacasa.Application.Features.Legal.Queries.GetLegalVersions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Abacasa.API.Controllers;

/// <summary>
/// Legal documents (terms of use, privacy notice)
/// </summary>
public class LegalController : BaseController
{
    private readonly IMediator _mediator;

    public LegalController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Current versions of the terms of use and the privacy notice
    /// </summary>
    [HttpGet("versions")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LegalVersionsDto), 200)]
    public async Task<IActionResult> GetVersions()
    {
        return HandleResult(await _mediator.Send(new GetLegalVersionsQuery()));
    }
}
