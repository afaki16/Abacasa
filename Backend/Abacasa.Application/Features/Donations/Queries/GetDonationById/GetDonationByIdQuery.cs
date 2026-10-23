using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Donations.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Donations.Queries.GetDonationById;

public class GetDonationByIdQuery : IRequest<Result<DonationDto>>
{
    public int Id { get; set; }
}
