using Abacasa.Application.Features.ExchangeRates.Dtos;
using Abacasa.Application.Interfaces;
using Abacasa.Domain.Common.Enums;
using Abacasa.Domain.Common.Interfaces;
using Abacasa.Domain.Entities;
using Abacasa.Infrastructure.Configuration;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;
using System.Globalization;
using System.Net;
using System.Xml.Linq;

namespace Abacasa.Infrastructure.Services;

// TCMB today.xml: kök elemanın Tarih özniteliği (dd.MM.yyyy) listenin tarihidir; hafta sonu ve tatilde son iş günü.
// USD ve EUR için ForexSelling (döviz satış) okunur; Unit 1'den farklıysa kur = değer / Unit.
// Geçmiş tarih listeleri arşivden (ArchiveUrlFormat) okunur; yayım olmayan günde arşiv 404 döner.
public class TcmbRateFetcher : IMarketRateFetcher
{
    private static readonly HttpClient Http = new();
    private static readonly Currency[] Currencies = { Currency.USD, Currency.EUR };

    // Arşivde geriye bakılan gün (uzun bayram tatilleri dahil)
    private const int ArchiveLookbackDays = 6;

    // Başarısız geçmiş tarih denemesinin tekrarlanmadığı süre (TCMB'yi her istekte yormamak için)
    private static readonly TimeSpan FailedRetryAfter = TimeSpan.FromMinutes(10);
    private static readonly ConcurrentDictionary<DateOnly, DateTime> FailedAttempts = new();

    private readonly IUnitOfWork _unitOfWork;
    private readonly TcmbRatesSettings _settings;
    private readonly ILogger<TcmbRateFetcher> _logger;

    public TcmbRateFetcher(IUnitOfWork unitOfWork, IConfiguration configuration, ILogger<TcmbRateFetcher> logger)
    {
        _unitOfWork = unitOfWork;
        _settings = configuration.GetSection("TcmbRates").Get<TcmbRatesSettings>() ?? new TcmbRatesSettings();
        _logger = logger;
    }

    public async Task<IReadOnlyList<MarketRateDto>> RefreshAsync(CancellationToken cancellationToken = default)
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(TimeSpan.FromSeconds(_settings.TimeoutSeconds));

        var xml = await Http.GetStringAsync(_settings.Url, timeout.Token);
        return await WriteListAsync(xml);
    }

    public async Task<IReadOnlyList<MarketRateDto>> FetchForDateAsync(DateOnly date, CancellationToken cancellationToken = default)
    {
        if (FailedAttempts.TryGetValue(date, out var failedAt) && DateTime.UtcNow - failedAt < FailedRetryAfter)
            return Array.Empty<MarketRateDto>();

        try
        {
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeout.CancelAfter(TimeSpan.FromSeconds(_settings.TimeoutSeconds));

            for (var day = date; day >= date.AddDays(-ArchiveLookbackDays); day = day.AddDays(-1))
            {
                if (day.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
                    continue;

                var url = string.Format(CultureInfo.InvariantCulture, _settings.ArchiveUrlFormat, day.ToDateTime(TimeOnly.MinValue));
                using var response = await Http.GetAsync(url, timeout.Token);
                if (response.StatusCode == HttpStatusCode.NotFound)
                    continue; // Tatil ya da henüz yayımlanmamış
                response.EnsureSuccessStatusCode();

                var written = await WriteListAsync(await response.Content.ReadAsStringAsync(timeout.Token));
                FailedAttempts.TryRemove(date, out _);
                return written;
            }

            _logger.LogWarning("TCMB arsivinde {Date} ve oncesi {Days} gun icin liste yok", date, ArchiveLookbackDays);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or FormatException or System.Xml.XmlException
            or Microsoft.EntityFrameworkCore.DbUpdateException)
        {
            _logger.LogWarning(ex, "TCMB arsivinden {Date} kurlari alinamadi", date);
        }

        FailedAttempts[date] = DateTime.UtcNow;
        return Array.Empty<MarketRateDto>();
    }

    // Listeyi okur, (birim, liste tarihi) kaydını ekler ya da günceller
    private async Task<IReadOnlyList<MarketRateDto>> WriteListAsync(string xml)
    {
        var root = XDocument.Parse(xml).Root ?? throw new FormatException("TCMB XML kök elemanı yok");

        var dateText = root.Attribute("Tarih")?.Value ?? throw new FormatException("TCMB XML tarihi yok");
        var date = DateOnly.ParseExact(dateText, "dd.MM.yyyy", CultureInfo.InvariantCulture);
        var now = DateTime.UtcNow;
        var written = new List<MarketRateDto>();

        foreach (var currency in Currencies)
        {
            var node = root.Elements("Currency").FirstOrDefault(e => (string?)e.Attribute("Kod") == currency.ToString())
                ?? throw new FormatException($"TCMB XML'de {currency} yok");
            var unit = int.Parse(node.Element("Unit")?.Value ?? "1", CultureInfo.InvariantCulture);
            var selling = decimal.Parse(node.Element("ForexSelling")?.Value ?? throw new FormatException($"{currency} ForexSelling yok"),
                NumberStyles.Number, CultureInfo.InvariantCulture);
            if (unit <= 0 || selling <= 0)
                throw new FormatException($"{currency} kuru geçersiz");

            var rate = Math.Round(unit == 1 ? selling : selling / unit, 4, MidpointRounding.AwayFromZero);

            var existing = await _unitOfWork.MarketRates.GetByDateAsync(currency, date);
            if (existing == null)
            {
                existing = new MarketRate { Currency = currency, Date = date, Rate = rate, Source = MarketRate.TcmbSource, FetchedAt = now };
                await _unitOfWork.MarketRates.AddAsync(existing);
            }
            else
            {
                existing.Rate = rate;
                existing.FetchedAt = now;
                _unitOfWork.MarketRates.Update(existing);
            }

            written.Add(new MarketRateDto
            {
                Currency = currency,
                Rate = rate,
                Date = date,
                Source = MarketRate.TcmbSource,
                FetchedAt = now,
                Created = existing.Id == 0
            });
        }

        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("TCMB kurlari yazildi ({Date}): {Rates}", date,
            string.Join(", ", written.Select(r => $"{r.Currency}={r.Rate}")));
        return written;
    }
}
