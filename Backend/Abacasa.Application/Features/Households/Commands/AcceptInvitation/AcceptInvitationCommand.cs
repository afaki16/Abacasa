using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Households.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Households.Commands.AcceptInvitation;

// Giriş yapmış kullanıcı kendi e-postasına gelen daveti kabul eder; hane değiştirme ayrı çağrıyla yapılır
public class AcceptInvitationCommand : IRequest<Result<AcceptInvitationResultDto>>
{
    public string Token { get; set; } = string.Empty;
}
