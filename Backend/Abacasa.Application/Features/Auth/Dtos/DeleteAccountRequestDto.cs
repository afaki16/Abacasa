namespace Abacasa.Application.Features.Auth.Dtos
{
    public class DeleteAccountRequestDto
    {
        public string Password { get; set; } = string.Empty;
        // Tek üyesi olunan hanelerin de silinmesi onayı
        public bool DeleteSoleHouseholds { get; set; }
    }
}
