using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.Admin.Commands.RevokeUserSessions
{
    public class RevokeUserSessionsCommand : IRequest<Result>
    {
        public int UserId { get; set; }
        public string? Reason { get; set; }
    }
}
