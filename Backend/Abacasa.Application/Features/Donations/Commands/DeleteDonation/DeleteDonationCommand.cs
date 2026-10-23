using Abacasa.Application.Common.Results;
using MediatR;

namespace Abacasa.Application.Features.Donations.Commands.DeleteDonation;

public class DeleteDonationCommand : IRequest<Result<bool>>
{
    public int Id { get; set; }
}
