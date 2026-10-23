using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.DonationFunds.Commands.DeleteFundMovement;

public class DeleteFundMovementCommand : IRequest<Result<bool>>
{
    public int FundId { get; set; }
    public int MovementId { get; set; }
}
