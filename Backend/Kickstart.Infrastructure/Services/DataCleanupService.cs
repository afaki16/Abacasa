using Kickstart.Domain.Common.Interfaces;
using Kickstart.Infrastructure.Configuration;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Kickstart.Infrastructure.Services
{
    /// <summary>
    /// Periodically hard-deletes expired tokens and old login attempts so these tables don't grow unbounded.
    /// </summary>
    public class DataCleanupService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly DataCleanupSettings _settings;
        private readonly ILogger<DataCleanupService> _logger;

        public DataCleanupService(
            IServiceScopeFactory scopeFactory,
            IConfiguration configuration,
            ILogger<DataCleanupService> logger)
        {
            _scopeFactory = scopeFactory;
            _settings = configuration.GetSection("DataCleanup").Get<DataCleanupSettings>() ?? new DataCleanupSettings();
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            if (!_settings.Enabled)
            {
                _logger.LogInformation("Data cleanup is disabled.");
                return;
            }

            try
            {
                await Task.Delay(TimeSpan.FromMinutes(_settings.InitialDelayMinutes), stoppingToken);
                await RunCleanupAsync(stoppingToken);

                using var timer = new PeriodicTimer(TimeSpan.FromHours(_settings.IntervalHours));
                while (await timer.WaitForNextTickAsync(stoppingToken))
                {
                    await RunCleanupAsync(stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                // Application is shutting down.
            }
        }

        private async Task RunCleanupAsync(CancellationToken stoppingToken)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
                var now = DateTime.UtcNow;

                var cutoff = now.AddDays(-_settings.RefreshTokenRetentionDays);
                var deleted = await unitOfWork.RefreshTokens.DeleteOlderThanAsync(cutoff, stoppingToken);
                LogDeleted("RefreshTokens", deleted, cutoff);

                cutoff = now.AddDays(-_settings.PasswordResetTokenRetentionDays);
                deleted = await unitOfWork.PasswordResetTokens.DeleteOlderThanAsync(cutoff, stoppingToken);
                LogDeleted("PasswordResetTokens", deleted, cutoff);

                cutoff = now.AddDays(-_settings.VerificationTokenRetentionDays);
                deleted = await unitOfWork.UserVerificationTokens.DeleteOlderThanAsync(cutoff, stoppingToken);
                LogDeleted("UserVerificationTokens", deleted, cutoff);

                cutoff = now.AddDays(-_settings.LoginAttemptRetentionDays);
                deleted = await unitOfWork.LoginAttempts.DeleteOlderThanAsync(cutoff, stoppingToken);
                LogDeleted("LoginAttempts", deleted, cutoff);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Data cleanup failed. Will retry on the next run.");
            }
        }

        private void LogDeleted(string table, int count, DateTime cutoff)
        {
            _logger.LogInformation("Data cleanup: {Table} - {Count} rows deleted (cutoff {Cutoff:O})", table, count, cutoff);
        }
    }
}
