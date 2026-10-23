using Abacasa.Application.Interfaces;
using Abacasa.Application.Features.Auth.Dtos;
using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.Auth.Commands.SwitchHousehold
{
    public class SwitchHouseholdCommandHandler : IRequestHandler<SwitchHouseholdCommand, Result<LoginResponseDto>>
    {
        private readonly IAuthService _authService;

        public SwitchHouseholdCommandHandler(IAuthService authService)
        {
            _authService = authService;
        }

        public async Task<Result<LoginResponseDto>> Handle(SwitchHouseholdCommand request, CancellationToken cancellationToken)
        {
            return await _authService.SwitchHouseholdAsync(request.UserId, request.TenantId, request.RefreshToken, request.IpAddress, request.UserAgent);
        }
    }
}
