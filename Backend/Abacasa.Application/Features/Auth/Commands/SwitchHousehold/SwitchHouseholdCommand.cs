using Abacasa.Application.Features.Auth.Dtos;
using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.Auth.Commands.SwitchHousehold
{
    public class SwitchHouseholdCommand : IRequest<Result<LoginResponseDto>>
    {
        public int UserId { get; set; }
        public int TenantId { get; set; }
        public string RefreshToken { get; set; }
        public string IpAddress { get; set; }
        public string UserAgent { get; set; }
    }
}
