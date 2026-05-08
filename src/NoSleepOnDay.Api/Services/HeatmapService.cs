using Microsoft.Extensions.Caching.Memory;
using NoSleepOnDay.Api.Contracts;
using NoSleepOnDay.Api.Domain;

namespace NoSleepOnDay.Api.Services;

public sealed class HeatmapService : IHeatmapService
{
    private readonly IRegionCatalog _catalog;
    private readonly IDaylightAnalysisService _analysis;
    private readonly IMemoryCache _cache;

    public HeatmapService(
        IRegionCatalog catalog,
        IDaylightAnalysisService analysis,
        IMemoryCache cache)
    {
        _catalog = catalog;
        _analysis = analysis;
        _cache = cache;
    }

    public HeatmapResponseDto GetOrCompute(int year, int shiftHours, TimeOnly wakeTime, double sleepHours)
    {
        var key = BuildKey(year, shiftHours, wakeTime, sleepHours);
        return _cache.GetOrCreate(key, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(7);
            entry.Size = 1;
            return Compute(year, shiftHours, wakeTime, sleepHours);
        })!;
    }

    private HeatmapResponseDto Compute(int year, int shiftHours, TimeOnly wakeTime, double sleepHours)
    {
        var period = DateRange.Build(PeriodType.Year, year, null);
        var window = new WakeWindow(wakeTime, sleepHours);

        var points = new HeatmapPointDto[_catalog.All.Count];
        Parallel.For(0, _catalog.All.Count, i =>
        {
            var region = _catalog.All[i];
            var result = _analysis.Analyze(region, period, window, shiftHours);
            points[i] = new HeatmapPointDto(
                region.Id,
                region.Iso2,
                region.Name,
                result.Delta.TotalGainMinutes,
                result.Delta.AvgGainPerDay);
        });

        return new HeatmapResponseDto(
            year,
            shiftHours,
            wakeTime.ToString("HH:mm"),
            sleepHours,
            points);
    }

    private static string BuildKey(int year, int shiftHours, TimeOnly wakeTime, double sleepHours)
    {
        return $"heatmap:{year}:{shiftHours}:{wakeTime:HHmm}:{sleepHours:F1}";
    }
}
