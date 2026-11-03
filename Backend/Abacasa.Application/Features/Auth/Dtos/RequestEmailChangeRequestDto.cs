namespace Abacasa.Application.Features.Auth.Dtos
{
    public class RequestEmailChangeRequestDto
    {
        public string NewEmail { get; set; } = string.Empty;
        public string CurrentPassword { get; set; } = string.Empty;
    }
}
