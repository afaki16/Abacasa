using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.ExchangeRates.Common;
using Abacasa.Application.Features.ExchangeRates.Dtos;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using MediatR;
using System.Collections.Generic;
using System.Linq;

namespace Abacasa.Application.Features.ExchangeRates.Queries.GetRatesAsOf;

public class GetRatesAsOfQueryHandler : IRequestHandler<GetRatesAsOfQuery, Result<List<CurrentRateDto>>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMarketRateFetcher _fetcher;

    public GetRatesAsOfQueryHandler(IUnitOfWork unitOfWork, IMarketRateFetcher fetcher)
    {
        _unitOfWork = unitOfWork;
        _fetcher = fetcher;
    }

    public async Task<Result<List<CurrentRateDto>>> Handle(GetRatesAsOfQuery request, CancellationToken cancellationToken)
    {
        // O tarihin TCMB listesi kayıtlı değilse (yakın tarihli liste yoksa) arşivden bir kez çekilir;
        // TCMB'ye ulaşılamazsa eldeki en yakın eski kur kullanılır
        var window = request.Date.AddDays(-CurrentRates.MarketWindowDays);
        var missing = false;
        foreach (var currency in CurrentRates.MarketCurrencies)
            if (await _unitOfWork.MarketRates.GetLatestOnOrBeforeAsync(currency, request.Date, window) == null)
                missing = true;
        if (missing)
            await _fetcher.FetchForDateAsync(request.Date, cancellationToken);

        var rates = new List<CurrentRateDto>();
        foreach (var currency in CurrentRates.ForeignCurrencies)
            if (await CurrentRates.GetAsOfAsync(_unitOfWork, currency, request.Date) is { } rate)
                rates.Add(rate);

        return Result<List<CurrentRateDto>>.Success(rates);
    }
}
