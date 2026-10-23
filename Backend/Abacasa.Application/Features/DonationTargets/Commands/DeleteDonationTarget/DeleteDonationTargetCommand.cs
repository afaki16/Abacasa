using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.DonationTargets.Commands.DeleteDonationTarget;

public class DeleteDonationTargetCommand : IRequest<Result<bool>>
{
    public int Id { get; set; }
}
