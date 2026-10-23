using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.DonationFunds.Dtos;
using MediatR;
using System.Collections.Generic;

namespace Abacasa.Application.Features.DonationFunds.Queries.GetFundMovements;

public class GetFundMovementsQuery : IRequest<Result<List<FundMovementDto>>>
{
    public int FundId { get; set; }
}
