using Abacasa.Application.Interfaces;
using Abacasa.Infrastructure.Configuration;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Abacasa.Infrastructure.Services
{
    /// <summary>
    /// TCMB kur işi: açılıştan StartupDelayMinutes sonra ve her IntervalHours'ta TcmbRateFetcher'ı çalıştırır.
    /// Hata (ağ, biçim) loglanır, bir sonraki çalışma beklenir; uygulama etkilenmez.
    /// </summary>
    public class TcmbRateService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly TcmbRatesSettings _settings;
        private readonly ILogger<TcmbRateService> _logger;

        public TcmbRateService(IServiceScopeFactory scopeFactory, IConfiguration configuration, ILogger<TcmbRateService> logger)
        {
            _scopeFactory = scopeFactory;
            _settings = configuration.GetSection("TcmbRates").Get<TcmbRatesSettings>() ?? new TcmbRatesSettings();
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            if (!_settings.Enabled)
            {
                _logger.LogInformation("TCMB kur isi kapali.");
                return;
            }

            try
            {
                await Task.Delay(TimeSpan.FromMinutes(_settings.StartupDelayMinutes), stoppingToken);
                await RunOnceAsync(stoppingToken);

                using var timer = new PeriodicTimer(TimeSpan.FromHours(_settings.IntervalHours));
                while (await timer.WaitForNextTickAsync(stoppingToken))
                    await RunOnceAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                // Uygulama kapanıyor
            }
        }

        private async Task RunOnceAsync(CancellationToken stoppingToken)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                await scope.ServiceProvider.GetRequiredService<IMarketRateFetcher>().RefreshAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "TCMB kurlari alinamadi; bir sonraki calismada yeniden denenecek.");
            }
        }
    }
}
