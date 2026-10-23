using Abacasa.Application.Features.Categories.Commands.CreateCategory;
using Abacasa.Application.Features.Categories.Commands.UpdateCategory;
using Abacasa.Application.Features.Categories.Commands.DeleteCategory;
using Abacasa.Application.Features.Categories.Dtos;
using Abacasa.Application.Features.Categories.Queries.GetAllCategories;
using Abacasa.Application.Features.Categories.Queries.GetCategoryById;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Abacasa.API.Controllers;

[Authorize]
public class CategoriesController : BaseController
{
    private readonly IMediator _mediator;

    public CategoriesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get all categories of the current household with pagination
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "categories.read")]
    [ProducesResponseType(typeof(IEnumerable<CategoryListDto>), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> GetAllCategories(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string searchTerm = null)
    {
        var query = new GetAllCategoriesQuery
        {
            Page = page,
            PageSize = pageSize,
            SearchTerm = searchTerm
        };

        var result = await _mediator.Send(query);
        return HandlePagedResult(result);
    }

    /// <summary>
    /// Get category by ID
    /// </summary>
    [HttpGet("{id:int}")]
    [Authorize(Policy = "categories.read")]
    [ProducesResponseType(typeof(CategoryDto), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetCategoryById(int id)
    {
        var result = await _mediator.Send(new GetCategoryByIdQuery { Id = id });
        return HandleResult(result);
    }

    /// <summary>
    /// Create a new category in the current household
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "categories.create")]
    [ProducesResponseType(typeof(CategoryListDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryDto dto)
    {
        var result = await _mediator.Send(new CreateCategoryCommand { Name = dto.Name });

        if (result.IsSuccess)
            return CreatedAtAction(
                nameof(GetCategoryById),
                new { id = result.Value.Id },
                new { success = true, data = result.Value });

        return HandleResult(result);
    }

    /// <summary>
    /// Update an existing category
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Policy = "categories.update")]
    [ProducesResponseType(typeof(CategoryListDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateCategory(int id, [FromBody] UpdateCategoryDto dto)
    {
        var result = await _mediator.Send(new UpdateCategoryCommand { Id = id, Name = dto.Name });
        return HandleResult(result);
    }

    /// <summary>
    /// Delete a category (soft delete)
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "categories.delete")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var result = await _mediator.Send(new DeleteCategoryCommand { Id = id });
        return HandleResult(result);
    }
}
