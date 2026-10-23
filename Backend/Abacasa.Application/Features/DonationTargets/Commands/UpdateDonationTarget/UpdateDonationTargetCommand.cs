using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.DonationTargets.Dtos;
using Abacasa.Domain.Common.Enums;
using MediatR;

namespace Abacasa.Application.Features.DonationTargets.Commands.UpdateDonationTarget;

public class UpdateDonationTargetCommand : IRequest<Result<DonationTargetDto>>
{
    public int Id { get; set; }
    public int? OwnerPersonId { get; set; }
    public int Year { get; set; }
    public DonationKind Kind { get; set; }
    public decimal Amount { get; set; }
    public string? Note { get; set; }
}
