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

        // Polar day: sun never sets → treat as 00:00–24:00 light window.
        // Polar night: sun never rises → treat as no daylight (sunrise == sunset at noon).
        if (sunriseUtc is null && sunsetUtc is null)
        {
            var noon = new DateTime(date.Year, date.Month, date.Day, 12, 0, 0, DateTimeKind.Utc);
            var altitude = SunCalc.GetSunPosition(noon, latitude, longitude).Altitude;
            if (altitude > 0)
            {
                // Polar day
                sunriseUtc = new DateTime(date.Year, date.Month, date.Day, 0, 0, 0, DateTimeKind.Utc);
                sunsetUtc  = new DateTime(date.Year, date.Month, date.Day, 23, 59, 59, DateTimeKind.Utc);
            }
            else
            {
                // Polar night
                sunriseUtc = noon;
                sunsetUtc  = noon;
            }
        }
        else if (sunriseUtc is null || sunsetUtc is null)
        {
            // Partial data: fallback to noon (zero daylight intersection)
            sunriseUtc ??= noonUtc;
            sunsetUtc  ??= noonUtc;
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
