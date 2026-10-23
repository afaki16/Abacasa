namespace Abacasa.Application.Features.Auth.Dtos
{
    public class RegisterRequestDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        // Davetsiz kayıtta zorunlu: e-posta doğrulanınca bu adla hane açılır
        public string? HouseholdName { get; set; }
        // Davetli kayıt: hane açılmaz, davet kabul edilir
        public string? InviteToken { get; set; }
        // İkisi de zorunlu: kullanım koşulları kabulü ve aydınlatma metninin okunduğu (ConsentRecord olarak yazılır)
        public bool AcceptTerms { get; set; }
        public bool AcknowledgePrivacy { get; set; }
    }
}
