using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.ExchangeRates.Dtos;
using MediatR;

namespace Abacasa.Application.Features.Admin.Commands.RefreshMarketRates;

// TCMB kurlarını şimdi çeker (yalnızca SuperAdmin); yazılan kurlar döner
public class RefreshMarketRatesCommand : IRequest<Result<IReadOnlyList<MarketRateDto>>>
{
}
