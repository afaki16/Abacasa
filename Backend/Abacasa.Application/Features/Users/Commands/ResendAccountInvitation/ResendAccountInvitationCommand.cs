using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.Users.Commands.ResendAccountInvitation
{
    /// <summary>
    /// Hesap davetini (şifre belirleme linki) tekrar gönderir. Hane davetiyle ilgisi yoktur.
    /// </summary>
    public class ResendAccountInvitationCommand : IRequest<Result>
    {
        public int Id { get; set; }
    }
}
