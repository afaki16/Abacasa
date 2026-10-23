using Abacasa.Application.Features.People.Commands.CreatePerson;
using Abacasa.Application.Features.People.Commands.UpdatePerson;
using Abacasa.Application.Features.People.Commands.DeletePerson;
using Abacasa.Application.Features.People.Dtos;
using Abacasa.Application.Features.People.Queries.GetAllPeople;
using Abacasa.Application.Features.People.Queries.GetPersonById;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Abacasa.API.Controllers;

[Authorize]
public class PeopleController : BaseController
{
    private readonly IMediator _mediator;

    public PeopleController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get all people of the current household with pagination
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "people.read")]
    [ProducesResponseType(typeof(IEnumerable<PersonListDto>), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> GetAllPeople(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string searchTerm = null)
    {
        var query = new GetAllPeopleQuery
        {
            Page = page,
            PageSize = pageSize,
            SearchTerm = searchTerm
        };

        var result = await _mediator.Send(query);
        return HandlePagedResult(result);
    }

    /// <summary>
    /// Get person by ID
    /// </summary>
    [HttpGet("{id:int}")]
    [Authorize(Policy = "people.read")]
    [ProducesResponseType(typeof(PersonDto), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetPersonById(int id)
    {
        var result = await _mediator.Send(new GetPersonByIdQuery { Id = id });
        return HandleResult(result);
    }

    /// <summary>
    /// Create a new person in the current household
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "people.create")]
    [ProducesResponseType(typeof(PersonListDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> CreatePerson([FromBody] CreatePersonDto dto)
    {
        var result = await _mediator.Send(new CreatePersonCommand
        {
            Name = dto.Name,
            Relation = dto.Relation
        });

        if (result.IsSuccess)
            return CreatedAtAction(
                nameof(GetPersonById),
                new { id = result.Value.Id },
                new { success = true, data = result.Value });

        return HandleResult(result);
    }

    /// <summary>
    /// Update an existing person
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Policy = "people.update")]
    [ProducesResponseType(typeof(PersonListDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdatePerson(int id, [FromBody] UpdatePersonDto dto)
    {
        var result = await _mediator.Send(new UpdatePersonCommand
        {
            Id = id,
            Name = dto.Name,
            Relation = dto.Relation
        });
        return HandleResult(result);
    }

    /// <summary>
    /// Delete a person (soft delete). A person owning a payment method cannot be deleted (409).
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "people.delete")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> DeletePerson(int id)
    {
        var result = await _mediator.Send(new DeletePersonCommand { Id = id });
        return HandleResult(result);
    }
}
