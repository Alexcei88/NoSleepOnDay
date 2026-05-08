using NoSleepOnDay.Api.Contracts;

namespace NoSleepOnDay.Api.Services;

public interface IHeatmapService
{
    HeatmapResponseDto GetOrCompute(int year, int shiftHours, TimeOnly wakeTime, double sleepHours);
}
