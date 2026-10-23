using Abacasa.Application.Interfaces;
using Abacasa.Infrastructure.Configuration;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Abacasa.Infrastructure.Services
{
    /// <summary>
    /// KVKK imha işi: açılıştan StartupDelayMinutes sonra ve her IntervalHours'ta DataRetentionRunner'ı çalıştırır.
    /// (Eski DataCleanupService'in token ve giriş denemesi temizliği de bu işin içindedir.)
    /// </summary>
    public class DataRetentionService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly DataRetentionSettings _settings;
        private readonly ILogger<DataRetentionService> _logger;

        public DataRetentionService(IServiceScopeFactory scopeFactory, IConfiguration configuration, ILogger<DataRetentionService> logger)
        {
            _scopeFactory = scopeFactory;
            _settings = configuration.GetSection("DataRetention").Get<DataRetentionSettings>() ?? new DataRetentionSettings();
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
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
                await scope.ServiceProvider.GetRequiredService<IDataRetentionRunner>().RunAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Imha isi basarisiz; bir sonraki calismada yeniden denenecek.");
            }
        }
    }
}
