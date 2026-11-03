using Abacasa.Application.Common.Localization;
using Abacasa.Application.Common.Results;
using Abacasa.Application.Features.ExchangeRates.Dtos;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Models;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Abacasa.Application.Features.Admin.Commands.RefreshMarketRates;

public class RefreshMarketRatesCommandHandler : IRequestHandler<RefreshMarketRatesCommand, Result<IReadOnlyList<MarketRateDto>>>
{
    private readonly IMarketRateFetcher _fetcher;
    private readonly ILogger<RefreshMarketRatesCommandHandler> _logger;
    private readonly IJsonStringLocalizer _localizer;

    public RefreshMarketRatesCommandHandler(IMarketRateFetcher fetcher, ILogger<RefreshMarketRatesCommandHandler> logger, IJsonStringLocalizer localizer)
    {
        _fetcher = fetcher;
        _logger = logger;
        _localizer = localizer;
    }

    public async Task<Result<IReadOnlyList<MarketRateDto>>> Handle(RefreshMarketRatesCommand request, CancellationToken cancellationToken)
    {
        try
        {
            return Result<IReadOnlyList<MarketRateDto>>.Success(await _fetcher.RefreshAsync(cancellationToken));
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or FormatException or System.Xml.XmlException)
        {
            // TCMB'ye erişilemedi ya da biçim beklenmedik: 502
            _logger.LogError(ex, "TCMB kurlari elle tetiklemede alinamadi");
            return Result<IReadOnlyList<MarketRateDto>>.Failure(Error.Failure(ErrorCode.InternalError, _localizer["exchangeRates.marketFetchFailed"], 502));
        }
    }
}
