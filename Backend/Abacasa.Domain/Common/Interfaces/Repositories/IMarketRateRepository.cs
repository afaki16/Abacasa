using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Entities;
using System;
using System.Threading.Tasks;

namespace Abacasa.Domain.Common.Interfaces.Repositories;

// Global piyasa kurları (tenant filtresi yok)
public interface IMarketRateRepository : IRepository<MarketRate, int>
{
    // En büyük Date, eşitlikte en büyük Id
    Task<MarketRate?> GetLatestAsync(Currency currency);

    // Tarihi [notBefore, date] aralığındaki en yeni kayıt; notBefore boşsa alt sınır yok
    Task<MarketRate?> GetLatestOnOrBeforeAsync(Currency currency, DateOnly date, DateOnly? notBefore = null);

    // Tracking'li; aynı tarih kaydı varsa güncellemek için
    Task<MarketRate?> GetByDateAsync(Currency currency, DateOnly date);
}
