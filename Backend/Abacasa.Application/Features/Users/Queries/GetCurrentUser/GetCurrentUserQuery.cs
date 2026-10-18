using Abacasa.Application.Features.Users.Dtos;
using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.Users.Queries.GetCurrentUser
{
    public class GetCurrentUserQuery : IRequest<Result<UserDto>>
    {
        public int UserId { get; set; }
    }
}
