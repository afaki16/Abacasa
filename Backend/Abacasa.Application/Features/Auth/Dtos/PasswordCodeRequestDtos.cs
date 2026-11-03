namespace Abacasa.Application.Features.Auth.Dtos
{
    // Kimlik global: e-posta tüm sistemde benzersiz olduğundan tenantId alanı yoktur
    // (gönderilirse model binding yok sayar).
    public class ResetPasswordWithCodeRequestDto
    {
        public string Email { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    public class ChangePasswordWithCodeRequestDto
    {
        public string Code { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}
