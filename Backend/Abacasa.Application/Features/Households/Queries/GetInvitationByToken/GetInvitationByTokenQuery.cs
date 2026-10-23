using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Households.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Households.Queries.GetInvitationByToken;

// Token sahibine davet özeti (anonim)
public class GetInvitationByTokenQuery : IRequest<Result<InvitationInfoDto>>
{
    public string Token { get; set; } = string.Empty;
}
