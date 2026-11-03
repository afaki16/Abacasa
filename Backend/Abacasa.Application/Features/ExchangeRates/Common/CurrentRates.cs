using Abacasa.Application.Features.ExchangeRates.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;

namespace Abacasa.Application.Features.ExchangeRates.Common;

// Güncel kur seçimi (tek yer): hanenin en son elle girdiği kur ile en son TCMB kuru arasından tarihi yeni olan;
// tarihler eşitse elle girilen. Çeyrek altının TCMB kuru yoktur (yalnızca elle).
public static class CurrentRates
{
    public const string ManualSource = "Elle";

    // TL dışındaki birimler (TL karşılığı kurla hesaplanır)
    public static readonly Currency[] ForeignCurrencies = { Currency.USD, Currency.EUR, Currency.QuarterGold };

    public static bool IsForeign(Currency currency) => currency != Currency.TRY;

    public static async Task<CurrentRateDto?> GetAsync(IUnitOfWork unitOfWork, Currency currency)
    {
        if (!IsForeign(currency)) return null;

        // Elle kurlar hane filtresinden geçer (yalnızca aktif hanenin kayıtları)
        var manual = await unitOfWork.ExchangeRates.GetLatestAsync(currency);
        var market = currency == Currency.QuarterGold ? null : await unitOfWork.MarketRates.GetLatestAsync(currency);

        if (manual != null && (market == null || manual.Date >= market.Date))
            return new CurrentRateDto { Currency = currency, Rate = manual.Rate, Date = manual.Date, Source = ManualSource };

        return market == null
            ? null
            : new CurrentRateDto { Currency = currency, Rate = market.Rate, Date = market.Date, Source = MarketRate.TcmbSource };
    }

    // Yabancı birimlerin güncel kurları; kuru olmayan birim sözlüğe girmez
    public static async Task<Dictionary<Currency, CurrentRateDto>> GetAllAsync(IUnitOfWork unitOfWork)
    {
        var rates = new Dictionary<Currency, CurrentRateDto>();
        foreach (var currency in ForeignCurrencies)
            if (await GetAsync(unitOfWork, currency) is { } rate)
                rates[currency] = rate;
        return rates;
    }
}
