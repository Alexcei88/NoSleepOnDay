using NoSleepOnDay.Api.Domain;

namespace NoSleepOnDay.Api.Services;

public interface IDaylightAnalysisService
{
    AnalysisResult Analyze(
        Region region,
        DateRange period,
        WakeWindow wakeWindow,
        int shiftHours);
}
