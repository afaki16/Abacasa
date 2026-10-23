using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Legal.Dtos;
using Abacasa.Application.Interfaces;
using MediatR;

namespace Abacasa.Application.Features.Legal.Queries.GetLegalVersions;

public class GetLegalVersionsQueryHandler : IRequestHandler<GetLegalVersionsQuery, Result<LegalVersionsDto>>
{
    private readonly ILegalVersions _legalVersions;

    public GetLegalVersionsQueryHandler(ILegalVersions legalVersions)
    {
        _legalVersions = legalVersions;
    }

    public Task<Result<LegalVersionsDto>> Handle(GetLegalVersionsQuery request, CancellationToken cancellationToken)
    {
        return Task.FromResult(Result<LegalVersionsDto>.Success(new LegalVersionsDto
        {
            TermsVersion = _legalVersions.TermsVersion,
            PrivacyNoticeVersion = _legalVersions.PrivacyNoticeVersion
        }));
    }
}
