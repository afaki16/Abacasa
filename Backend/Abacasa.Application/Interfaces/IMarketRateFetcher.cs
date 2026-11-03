using Abacasa.Application.Features.ExchangeRates.Dtos;

namespace Abacasa.Application.Interfaces;

// TCMB döviz satış kurlarını (USD, EUR) çeker ve MarketRates'e yazar: (birim, tarih) varsa günceller, yoksa ekler.
// Ağ ya da biçim hatasında istisna atar (arka plan işi loglayıp bir sonraki çalışmayı bekler).
public interface IMarketRateFetcher
{
    Task<IReadOnlyList<MarketRateDto>> RefreshAsync(CancellationToken cancellationToken = default);
}
