namespace Abacasa.Application.Features.Legal.Dtos;

public class LegalVersionsDto
{
    public string TermsVersion { get; set; } = string.Empty;
    public string PrivacyNoticeVersion { get; set; } = string.Empty;
}

// documentTypes: "Terms" / "PrivacyNotice"
public class AcceptConsentsRequestDto
{
    public List<string> DocumentTypes { get; set; } = new();
}

public class ConsentStatusDto
{
    public List<string> PendingConsents { get; set; } = new();
}
