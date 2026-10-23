using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.DonationFunds.Dtos;
using Abacasa.Domain.Common.Enums;
using MediatR;
using System;

namespace Abacasa.Application.Features.DonationFunds.Commands.CreateFundMovement;

public class CreateFundMovementCommand : IRequest<Result<FundMovementDto>>
{
    public int FundId { get; set; }
    public FundMovementType Type { get; set; }
    public DateOnly? Date { get; set; }
    public decimal Amount { get; set; }
    public string? Note { get; set; }
}
