using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.DonationFunds.Commands.DeleteDonationFund;

public class DeleteDonationFundCommand : IRequest<Result<bool>>
{
    public int Id { get; set; }
}
