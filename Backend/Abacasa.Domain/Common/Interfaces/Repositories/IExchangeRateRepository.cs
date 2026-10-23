using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Abacasa.Domain.Common.Interfaces.Repositories;

public interface IExchangeRateRepository : IRepository<ExchangeRate, int>
{
    // En büyük Date, eşitlikte en büyük Id
    Task<ExchangeRate?> GetLatestAsync(Currency currency);

    // Tracking'li; aynı gün kaydı varsa güncellemek için
    Task<ExchangeRate?> GetByDateAsync(Currency currency, DateOnly date);

    // Tarihe göre azalan
    Task<List<ExchangeRate>> GetRecentAsync(Currency? currency, int count);
}
