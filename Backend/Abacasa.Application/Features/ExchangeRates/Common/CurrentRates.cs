using Abacasa.Application.Features.ExchangeRates.Dtos;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using System;

namespace Abacasa.Application.Features.ExchangeRates.Common;

// Güncel kur seçimi (tek yer): hanenin en son elle girdiği kur ile en son TCMB kuru arasından tarihi yeni olan;
// tarihler eşitse elle girilen. Çeyrek altının TCMB kuru yoktur (yalnızca elle).
public static class CurrentRates
{
    public const string ManualSource = "Elle";

    // TL dışındaki birimler (TL karşılığı kurla hesaplanır)
    public static readonly Currency[] ForeignCurrencies = { Currency.USD, Currency.EUR, Currency.QuarterGold };

    // TCMB'nin yayımladığı birimler
    public static readonly Currency[] MarketCurrencies = { Currency.USD, Currency.EUR };

    // Geçmiş tarihte TCMB kuru bu kadar gün içinde kayıtlı değilse arşivden çekilir (hafta sonu + uzun tatil)
    public const int MarketWindowDays = 9;

    public static bool IsForeign(Currency currency) => currency != Currency.TRY;

    // Bir tarihte geçerli kur: o tarih ve öncesindeki en son elle girilen kur ile en son TCMB kuru arasından
    // tarihi yeni olan; eşitse elle girilen (güncel kurla aynı kural, tarih sınırıyla)
    public static async Task<CurrentRateDto?> GetAsOfAsync(IUnitOfWork unitOfWork, Currency currency, DateOnly date)
    {
        if (!IsForeign(currency)) return null;

        var manual = await unitOfWork.ExchangeRates.GetLatestOnOrBeforeAsync(currency, date);
        var market = currency == Currency.QuarterGold ? null : await unitOfWork.MarketRates.GetLatestOnOrBeforeAsync(currency, date);

        if (manual != null && (market == null || manual.Date >= market.Date))
            return new CurrentRateDto { Currency = currency, Rate = manual.Rate, Date = manual.Date, Source = ManualSource };

        return market == null
            ? null
            : new CurrentRateDto { Currency = currency, Rate = market.Rate, Date = market.Date, Source = MarketRate.TcmbSource };
    }

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
