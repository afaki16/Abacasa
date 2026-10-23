using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.DonationTargets.Dtos;
using MediatR;

namespace Abacasa.Application.Features.DonationTargets.Queries.GetDonationTargetById;

public class GetDonationTargetByIdQuery : IRequest<Result<DonationTargetDto>>
{
    public int Id { get; set; }
}
