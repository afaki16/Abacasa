using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.DonationFunds.Dtos;
using Abacasa.Domain.Common.Enums;
using MediatR;
using System;

namespace Abacasa.Application.Features.DonationFunds.Commands.UpdateDonationFund;

public class UpdateDonationFundCommand : IRequest<Result<DonationFundDto>>
{
    public int Id { get; set; }
    public int FromPersonId { get; set; }
    public DonationKind Kind { get; set; }
    public decimal Amount { get; set; }
    public DateOnly Date { get; set; }
    public string? Note { get; set; }
}
