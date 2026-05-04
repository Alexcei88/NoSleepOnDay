namespace NoSleepOnDay.Api.Services;

public interface ISunCalculator
{
    SunTimes GetSunTimes(DateOnly date, double latitude, double longitude, string timeZoneId);
}

public sealed record SunTimes(DateTime SunriseLocal, DateTime SunsetLocal);
