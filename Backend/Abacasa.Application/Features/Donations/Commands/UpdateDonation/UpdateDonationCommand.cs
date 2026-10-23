using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.Donations.Dtos;
using Abacasa.Domain.Common.Enums;
using MediatR;
using System;

namespace Abacasa.Application.Features.Donations.Commands.UpdateDonation;

public class UpdateDonationCommand : IRequest<Result<DonationListDto>>
{
    public int Id { get; set; }
    public DateOnly Date { get; set; }
    public decimal Amount { get; set; }
    public DonationKind Kind { get; set; }
    public string Recipient { get; set; }
    public int? GiverPersonId { get; set; }
    public int PaymentMethodId { get; set; }
    public string? Note { get; set; }
    /// Emanetten dağıtım; doluysa bağış hiçbir toplama ve hedefe girmez
    public int? FundId { get; set; }
}
