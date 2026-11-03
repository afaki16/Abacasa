using Abacasa.Application.Common.Sanitization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Abacasa.API.Controllers;

/// <summary>
/// Development-only helpers behind the frontend component showcase (/dev/*). Every action returns
/// 404 outside Development, so nothing here is reachable in staging or production.
/// </summary>
// Route comes from BaseController: api/[controller] → /api/dev/...
[ApiExplorerSettings(IgnoreApi = true)]
[Authorize]
public class DevController : BaseController
{
    private readonly IHostEnvironment _environment;

    public DevController(IHostEnvironment environment)
    {
        _environment = environment;
    }

    public class SanitizeHtmlRequest
    {
        public string? Html { get; set; }
    }

    /// <summary>Runs <see cref="HtmlContentSanitizer"/> so the showcase can show what would be stored.</summary>
    [HttpPost("sanitize-html")]
    public IActionResult SanitizeHtml([FromBody] SanitizeHtmlRequest request)
    {
        if (!_environment.IsDevelopment())
            return NotFound();

        return Ok(new { success = true, data = new { html = HtmlContentSanitizer.Clean(request.Html) } });
    }

    /// <summary>Backend allow-list, compared against the frontend list in the showcase to catch drift.</summary>
    [HttpGet("rich-text-allow-list")]
    public IActionResult RichTextAllowList()
    {
        if (!_environment.IsDevelopment())
            return NotFound();

        return Ok(new
        {
            success = true,
            data = new { tags = HtmlContentSanitizer.AllowedTags, attributes = HtmlContentSanitizer.AllowedAttributes }
        });
    }
}
