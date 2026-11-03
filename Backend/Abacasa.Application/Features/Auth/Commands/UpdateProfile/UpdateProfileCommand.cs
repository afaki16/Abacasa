using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.Auth.Commands.UpdateProfile
{
    /// <summary>The signed-in user updates their own basic info. Email has its own verified flow.</summary>
    public class UpdateProfileCommand : IRequest<Result>
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
    }
}
