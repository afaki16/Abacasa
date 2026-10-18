using Kickstart.Application.Features.Auth.Queries.GetUserSessions;
using Kickstart.Domain.Common.Interfaces;
using Kickstart.Domain.Common.Interfaces.Repositories;
using Kickstart.Application.Features.Auth.Dtos;
using Kickstart.Application.Common.Results;
using Kickstart.Application.Common.Localization;
using Kickstart.Domain.Common.Enums;
using Kickstart.Domain.Models;
using MediatR;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Kickstart.Application.Features.Auth.Queries.GetUserSessions
{
    public class GetUserSessionsQueryHandler : IRequestHandler<GetUserSessionsQuery, Result<IEnumerable<SessionDto>>>
    {
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly ILogger<GetUserSessionsQueryHandler> _logger;
        private readonly IJsonStringLocalizer _localizer;

        public GetUserSessionsQueryHandler(
            IRefreshTokenRepository refreshTokenRepository,
            ILogger<GetUserSessionsQueryHandler> logger,
            IJsonStringLocalizer localizer)
        {
            _refreshTokenRepository = refreshTokenRepository;
            _logger = logger;
            _localizer = localizer;
        }

        public async Task<Result<IEnumerable<SessionDto>>> Handle(GetUserSessionsQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var tokens = await _refreshTokenRepository.GetUserTokensAsync(request.UserId, includeRevoked: true);
                
                var sessions = tokens.Select(token => new SessionDto
                {
                    Id = token.Id,
                    Token = !string.IsNullOrEmpty(token.Token) && token.Token.Length >= 8
                        ? "••••" + token.Token[^8..]
                        : "••••••••",
                    CreatedDate = token.CreatedDate,
                    ExpiryDate = token.ExpiryDate,
                    IsActive = token.IsActive,
                    IpAddress = token.IpAddress ?? "Unknown",
                    UserAgent = token.UserAgent ?? "Unknown",
                    DeviceId = token.DeviceId ?? "Unknown",
                    DeviceName = token.DeviceName ?? "Unknown",
                    DeviceType = token.DeviceType ?? "Unknown",
                    Location = token.Location ?? "Unknown",
                    RemainingTime = token.GetRemainingTime(),
                    IsCurrentSession = false // TODO: Implement current session detection
                });

            return Result<IEnumerable<SessionDto>>.Success(sessions);
        }
            catch (Exception ex)
            {
            _logger.LogError(ex, "Error retrieving sessions for user {UserId}", request.UserId);
            return Result<IEnumerable<SessionDto>>.Failure(Error.Failure(
               ErrorCode.InternalError,
               _localizer["auth.sessionsLoadFailed"]));
            }
        }
    }
} 
