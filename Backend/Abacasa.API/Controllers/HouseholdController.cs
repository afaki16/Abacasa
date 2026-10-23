using Abacasa.Application.Features.Households.Commands.CreateHouseholdInvitation;
using Abacasa.Application.Features.Households.Commands.DeleteHousehold;
using Abacasa.Application.Features.Households.Commands.LeaveHousehold;
using Abacasa.Application.Features.Households.Commands.RemoveHouseholdMember;
using Abacasa.Application.Features.Households.Commands.ResendHouseholdInvitation;
using Abacasa.Application.Features.Households.Commands.RevokeHouseholdInvitation;
using Abacasa.Application.Features.Households.Commands.UpdateHousehold;
using Abacasa.Application.Features.Households.Commands.UpdateHouseholdMember;
using Abacasa.Application.Features.Households.Dtos;
using Abacasa.Application.Features.Households.Queries.GetHousehold;
using Abacasa.Application.Features.Households.Queries.GetHouseholdInvitations;
using Abacasa.Application.Features.Households.Queries.GetHouseholdMembers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Abacasa.API.Controllers;

/// <summary>
/// Active household (tenant_id in the token): details, members and invitations.
/// Requests for another household's membership or invitation return 404.
/// </summary>
[Authorize]
public class HouseholdController : BaseController
{
    private readonly IMediator _mediator;

    public HouseholdController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Active household with member count
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "household.read")]
    [ProducesResponseType(typeof(HouseholdDetailDto), 200)]
    public async Task<IActionResult> GetHousehold()
    {
        return HandleResult(await _mediator.Send(new GetHouseholdQuery()));
    }

    /// <summary>
    /// Rename the active household (required, max 100)
    /// </summary>
    [HttpPut]
    [Authorize(Policy = "household.update")]
    [ProducesResponseType(typeof(HouseholdDetailDto), 200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> UpdateHousehold([FromBody] UpdateHouseholdDto dto)
    {
        return HandleResult(await _mediator.Send(new UpdateHouseholdCommand { Name = dto.Name }));
    }

    /// <summary>
    /// Permanently delete the active household with all its records, memberships and invitations.
    /// Requires the caller's password and the exact household name; seed households cannot be deleted (400).
    /// </summary>
    [HttpDelete]
    [Authorize(Policy = "household.delete")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> DeleteHousehold([FromBody] DeleteHouseholdDto dto)
    {
        return HandleResult(await _mediator.Send(new DeleteHouseholdCommand { Password = dto.Password, ConfirmName = dto.ConfirmName }));
    }

    /// <summary>
    /// Live members of the active household
    /// </summary>
    [HttpGet("members")]
    [Authorize(Policy = "householdmembers.read")]
    [ProducesResponseType(typeof(List<HouseholdMemberDto>), 200)]
    public async Task<IActionResult> GetMembers()
    {
        return HandleResult(await _mediator.Send(new GetHouseholdMembersQuery()));
    }

    /// <summary>
    /// Change a member's role and linked person. The last admin cannot be demoted (400).
    /// </summary>
    [HttpPut("members/{membershipId:int}")]
    [Authorize(Policy = "householdmembers.update")]
    [ProducesResponseType(typeof(HouseholdMemberDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateMember(int membershipId, [FromBody] UpdateHouseholdMemberDto dto)
    {
        return HandleResult(await _mediator.Send(new UpdateHouseholdMemberCommand
        {
            MembershipId = membershipId,
            Role = dto.Role,
            PersonId = dto.PersonId
        }));
    }

    /// <summary>
    /// Remove a member (soft delete). Removing yourself is not allowed here (400); use leave.
    /// </summary>
    [HttpDelete("members/{membershipId:int}")]
    [Authorize(Policy = "householdmembers.delete")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> RemoveMember(int membershipId)
    {
        return HandleResult(await _mediator.Send(new RemoveHouseholdMemberCommand { MembershipId = membershipId }));
    }

    /// <summary>
    /// Leave the active household. The last member or the last admin cannot leave (400).
    /// No permission required; the next refresh selects a new active household.
    /// </summary>
    [HttpPost("leave")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Leave()
    {
        return HandleResult(await _mediator.Send(new LeaveHouseholdCommand()));
    }

    /// <summary>
    /// Invitations of the active household: pending first, then newest
    /// </summary>
    [HttpGet("invitations")]
    [Authorize(Policy = "householdmembers.read")]
    [ProducesResponseType(typeof(List<HouseholdInvitationDto>), 200)]
    public async Task<IActionResult> GetInvitations()
    {
        return HandleResult(await _mediator.Send(new GetHouseholdInvitationsQuery()));
    }

    /// <summary>
    /// Invite an email address. 409 if already a member or a pending invitation exists.
    /// The invitation is created even if the email cannot be sent (emailSent: false).
    /// </summary>
    [HttpPost("invitations")]
    [Authorize(Policy = "householdmembers.create")]
    [ProducesResponseType(typeof(HouseholdInvitationSendResultDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> CreateInvitation([FromBody] CreateHouseholdInvitationDto dto)
    {
        var result = await _mediator.Send(new CreateHouseholdInvitationCommand
        {
            Email = dto.Email,
            Role = dto.Role,
            PersonId = dto.PersonId
        });

        if (result.IsSuccess)
            return StatusCode(201, new { success = true, data = result.Value });

        return HandleResult(result);
    }

    /// <summary>
    /// New token and expiry for a pending or expired invitation; the old token stops working
    /// </summary>
    [HttpPost("invitations/{id:int}/resend")]
    [Authorize(Policy = "householdmembers.create")]
    [ProducesResponseType(typeof(HouseholdInvitationSendResultDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> ResendInvitation(int id)
    {
        return HandleResult(await _mediator.Send(new ResendHouseholdInvitationCommand { Id = id }));
    }

    /// <summary>
    /// Revoke a pending invitation
    /// </summary>
    [HttpDelete("invitations/{id:int}")]
    [Authorize(Policy = "householdmembers.delete")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> RevokeInvitation(int id)
    {
        return HandleResult(await _mediator.Send(new RevokeHouseholdInvitationCommand { Id = id }));
    }
}
