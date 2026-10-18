using Abacasa.Application.Features.Auth.Dtos;
using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.Auth.Commands.RefreshToken
{
    public class RefreshTokenCommand : IRequest<Result<LoginResponseDto>>
    {
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
        public string IpAddress { get; set; }
        public string UserAgent { get; set; }
    }
} 
