using Abacasa.Application.Features.Auth.Dtos;
using Abacasa.Application.Common.Results;
using MediatR;
using System.Collections.Generic;

namespace Abacasa.Application.Features.Auth.Queries.GetUserSessions
{
    public class GetUserSessionsQuery : IRequest<Result<IEnumerable<SessionDto>>>
    {
        public int UserId { get; set; }
    }
} 
