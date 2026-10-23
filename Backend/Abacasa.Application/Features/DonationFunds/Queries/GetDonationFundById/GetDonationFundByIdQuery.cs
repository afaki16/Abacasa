using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.DonationFunds.Dtos;
using MediatR;

namespace Abacasa.Application.Features.DonationFunds.Queries.GetDonationFundById;

public class GetDonationFundByIdQuery : IRequest<Result<DonationFundDto>>
{
    public int Id { get; set; }
}
