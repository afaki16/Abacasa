using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Legal.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Legal.Queries.GetLegalVersions;

// Kullanım koşulları ve aydınlatma metninin güncel sürümleri (anonim)
public class GetLegalVersionsQuery : IRequest<Result<LegalVersionsDto>>
{
}
