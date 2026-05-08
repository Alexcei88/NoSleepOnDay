namespace NoSleepOnDay.Api.Services;

/// <summary>
/// На старте прогревает кеш для дефолтных параметров фронта (год = текущий + 1, shift = ±1, окно 06:00 / 8 ч).
/// Так первый клиент не ждёт 1–2 секунды на холодный расчёт.
/// </summary>
public sealed class HeatmapWarmupHostedService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<HeatmapWarmupHostedService> _logger;

    public HeatmapWarmupHostedService(IServiceProvider services, ILogger<HeatmapWarmupHostedService> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _ = Task.Run(() =>
        {
            try
            {
                using var scope = _services.CreateScope();
                var heatmap = scope.ServiceProvider.GetRequiredService<IHeatmapService>();
                var year = DateTime.UtcNow.Year + 1;
                var wake = new TimeOnly(6, 0);
                const double sleep = 8.0;

                var sw = System.Diagnostics.Stopwatch.StartNew();
                heatmap.GetOrCompute(year, 1, wake, sleep);
                heatmap.GetOrCompute(year, -1, wake, sleep);
                heatmap.GetOrCompute(year, 2, wake, sleep);
                heatmap.GetOrCompute(year, -2, wake, sleep);
                sw.Stop();

                _logger.LogInformation(
                    "Heatmap warmup done in {Elapsed} ms (year={Year}, shifts=±1,±2)", sw.ElapsedMilliseconds, year);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Heatmap warmup failed (non-fatal)");
            }
        }, stoppingToken);

        return Task.CompletedTask;
    }
}
