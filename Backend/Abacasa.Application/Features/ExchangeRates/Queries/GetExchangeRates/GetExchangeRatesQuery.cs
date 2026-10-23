using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.ExchangeRates.Dtos;
using Abacasa.Domain.Common.Enums;
using MediatR;
using System.Collections.Generic;

namespace Abacasa.Application.Features.ExchangeRates.Queries.GetExchangeRates;

public class GetExchangeRatesQuery : IRequest<Result<List<ExchangeRateDto>>>
{
    public Currency? Currency { get; set; }
}
