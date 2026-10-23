namespace Abacasa.Application.Features.Auth.Dtos
{
    public class SwitchHouseholdRequestDto
    {
        public int TenantId { get; set; }
        // Cookie'si olmayan istemciler için; cookie varsa o kullanılır
        public string? RefreshToken { get; set; }
    }
}
