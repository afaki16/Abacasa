using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Legal.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Auth.Commands.AcceptConsents;

// Giriş yapmış kullanıcı belgeleri güncel sürümleriyle onaylar; kalan bekleyen onaylar döner
public class AcceptConsentsCommand : IRequest<Result<ConsentStatusDto>>
{
    public List<string> DocumentTypes { get; set; } = new();
}
