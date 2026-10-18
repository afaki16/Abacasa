using Abacasa.Application.Interfaces;
using Abacasa.Application.Features.Auth.Commands.Login;
using Abacasa.Application.Features.Auth.Commands.Logout;
using Abacasa.Application.Features.Auth.Commands.LogoutAll;
using Abacasa.Application.Features.Auth.Commands.LogoutDevice;
using Abacasa.Application.Features.Auth.Commands.Register;
using Abacasa.Application.Features.Auth.Commands.RefreshToken;
using Abacasa.Application.Features.Auth.Commands.ChangePassword;
using Abacasa.Application.Features.Auth.Commands.ForgotPassword;
using Abacasa.Application.Features.Auth.Commands.ResetPassword;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Common.Interfaces.Repositories;
using Abacasa.Application.Common.Results;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Models;
using MediatR;
using Microsoft.Extensions.Logging;
using System.Threading;
using System.Threading.Tasks;

namespace Abacasa.Application.Features.Auth.Commands.LogoutAll
{
    public class LogoutAllCommandHandler : IRequestHandler<LogoutAllCommand, Result>
    {
        private readonly IAuthService _authService;
        private readonly ICurrentUserService _currentUserService;
        private readonly ILogger<LogoutAllCommandHandler> _logger;

        public LogoutAllCommandHandler(
            IAuthService authService,
            ICurrentUserService currentUserService,
            ILogger<LogoutAllCommandHandler> logger)
        {
            _authService = authService;
            _currentUserService = currentUserService;
            _logger = logger;
        }

        public async Task<Result> Handle(LogoutAllCommand request, CancellationToken cancellationToken)
        {
            var userId = _currentUserService.UserId;
            if (!userId.HasValue)
            return Result<int>.Failure(Error.Failure(
               ErrorCode.NotFound,
               "User not authenticated"));

            _logger.LogWarning(
                "Logout all devices requested. UserId: {UserId}",
                userId.Value);

        return await _authService.RevokeAllUserTokensAsync(userId.Value, request.IpAddress, request.UserAgent, request.Reason);
        }
    }
} 
