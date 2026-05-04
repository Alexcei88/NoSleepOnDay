using SunCalcNet;
using SunCalcNet.Model;
using TimeZoneConverter;

namespace NoSleepOnDay.Api.Services;

public sealed class SunCalculator : ISunCalculator
{
    public SunTimes GetSunTimes(DateOnly date, double latitude, double longitude, string timeZoneId)
    {
        var noonUtc = new DateTime(date.Year, date.Month, date.Day, 12, 0, 0, DateTimeKind.Utc);
        var phases = SunCalc.GetSunPhases(noonUtc, latitude, longitude).ToList();

        var sunriseUtc = TryFindPhase(phases, SunPhaseName.Sunrise);
        var sunsetUtc = TryFindPhase(phases, SunPhaseName.Sunset);

        if (sunriseUtc is null || sunsetUtc is null)
        {
            throw new InvalidOperationException(
                $"Sunrise/sunset undefined for {date:yyyy-MM-dd} at ({latitude}, {longitude}) — likely polar day or polar night.");
        }

        var tz = TZConvert.GetTimeZoneInfo(timeZoneId);
        var sunriseLocal = TimeZoneInfo.ConvertTimeFromUtc(
            DateTime.SpecifyKind(sunriseUtc.Value, DateTimeKind.Utc),
            tz);
        var sunsetLocal = TimeZoneInfo.ConvertTimeFromUtc(
            DateTime.SpecifyKind(sunsetUtc.Value, DateTimeKind.Utc),
            tz);

        return new SunTimes(sunriseLocal, sunsetLocal);
    }

    private static DateTime? TryFindPhase(IEnumerable<SunPhase> phases, SunPhaseName name)
    {
        foreach (var phase in phases)
        {
            if (phase.Name.Value == name.Value)
            {
                return phase.PhaseTime;
            }
        }

        return null;
    }
}
