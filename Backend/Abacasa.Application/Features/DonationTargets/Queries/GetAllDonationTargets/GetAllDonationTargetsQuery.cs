using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.DonationTargets.Dtos;
using MediatR;

namespace Abacasa.Application.Features.DonationTargets.Queries.GetAllDonationTargets;

public class GetAllDonationTargetsQuery : IRequest<PagedResult<DonationTargetDto>>
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public int? Year { get; set; }
}
