using Abacasa.Application.Features.ExchangeRates.Dtos;

namespace Abacasa.Application.Interfaces;

// TCMB döviz satış kurlarını (USD, EUR) çeker ve MarketRates'e yazar: (birim, tarih) varsa günceller, yoksa ekler.
// Ağ ya da biçim hatasında istisna atar (arka plan işi loglayıp bir sonraki çalışmayı bekler).
public interface IMarketRateFetcher
{
    Task<IReadOnlyList<MarketRateDto>> RefreshAsync(CancellationToken cancellationToken = default);

    // Geçmiş tarih: TCMB arşivinden date ve en çok 6 gün öncesinin ilk yayımlanmış listesini (hafta sonu ve tatil
    // atlanır) çekip yazar. Liste bulunamazsa ya da TCMB'ye ulaşılamazsa boş döner (istisna atmaz); aynı tarih için
    // başarısız deneme kısa süre tekrarlanmaz.
    Task<IReadOnlyList<MarketRateDto>> FetchForDateAsync(DateOnly date, CancellationToken cancellationToken = default);
}
