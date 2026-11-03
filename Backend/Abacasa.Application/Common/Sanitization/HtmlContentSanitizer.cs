using Ganss.Xss;

namespace Abacasa.Application.Common.Sanitization;

/// <summary>
/// Allow-list HTML sanitizer for user-submitted rich text (RichTextEditor / TipTap output).
/// Call <see cref="Clean"/> in the command handler before saving any HTML field, so stored content
/// is safe even if the frontend is bypassed (defense-in-depth; RichTextDisplay sanitizes again on render).
///
/// KEEP IN SYNC with Frontend/utils/richTextContent.ts (RICH_TEXT_ALLOWED_TAGS / _ATTR). If the lists
/// drift, the editor preview shows elements that silently disappear on save.
///   • Tags: TipTap output + div/table (pasted templates)
///   • Attributes: href, target, rel (links only)
///   • URI schemes: http, https, mailto, tel (javascript: etc. are stripped)
///   • No inline style: an XSS vector and a source of inconsistent typography
///
/// <see cref="HtmlSanitizer"/> is thread-safe — one static instance is enough.
/// </summary>
public static class HtmlContentSanitizer
{
    public static readonly IReadOnlyList<string> AllowedTags = new[]
    {
        "p", "br", "span", "div",
        "strong", "em", "u", "s",
        "h1", "h2", "h3", "h4", "h5", "h6",
        "ul", "ol", "li",
        "table", "thead", "tbody", "tr", "th", "td",
        "a"
    };

    public static readonly IReadOnlyList<string> AllowedAttributes = new[] { "href", "target", "rel" };

    private static readonly HtmlSanitizer Sanitizer = CreateSanitizer();

    private static HtmlSanitizer CreateSanitizer()
    {
        var s = new HtmlSanitizer();

        s.AllowedTags.Clear();
        foreach (var tag in AllowedTags)
            s.AllowedTags.Add(tag);

        s.AllowedAttributes.Clear();
        foreach (var attr in AllowedAttributes)
            s.AllowedAttributes.Add(attr);

        s.AllowedSchemes.Clear();
        foreach (var scheme in new[] { "http", "https", "mailto", "tel" })
            s.AllowedSchemes.Add(scheme);

        s.AllowedCssProperties.Clear();

        return s;
    }

    /// <summary>
    /// Plain text (older records, or content that never had HTML) passes through unchanged.
    /// Empty input returns an empty string.
    /// </summary>
    public static string Clean(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        return Sanitizer.Sanitize(input);
    }
}
