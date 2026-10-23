using Abacasa.Application.Features.Households.Commands.AcceptInvitation;
using Abacasa.Application.Features.Households.Dtos;
using Abacasa.Application.Features.Households.Queries.GetInvitationByToken;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Abacasa.API.Controllers;

/// <summary>
/// Invitation endpoints for the token holder
/// </summary>
public class InvitationsController : BaseController
{
    private readonly IMediator _mediator;

    public InvitationsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Invitation summary for the token (household, inviter, email, role, status, whether the user exists)
    /// </summary>
    [HttpGet("{token}")]
    [AllowAnonymous]
    [EnableRateLimiting("sensitive")]
    [ProducesResponseType(typeof(InvitationInfoDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetByToken(string token)
    {
        return HandleResult(await _mediator.Send(new GetInvitationByTokenQuery { Token = token }));
    }

    /// <summary>
    /// Accept an invitation sent to the signed-in user's email. Returns the household id;
    /// the client then switches household.
    /// </summary>
    [HttpPost("accept")]
    [Authorize]
    [ProducesResponseType(typeof(AcceptInvitationResultDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Accept([FromBody] AcceptInvitationDto dto)
    {
        return HandleResult(await _mediator.Send(new AcceptInvitationCommand { Token = dto.Token }));
    }
}
