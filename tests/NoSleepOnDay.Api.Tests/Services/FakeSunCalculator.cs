using NoSleepOnDay.Api.Services;

namespace NoSleepOnDay.Api.Tests.Services;

public sealed class FakeSunCalculator : ISunCalculator
{
    private readonly Dictionary<DateOnly, SunTimes> _byDate;

    public FakeSunCalculator(Dictionary<DateOnly, SunTimes> byDate)
    {
        _byDate = byDate;
    }

    public SunTimes GetSunTimes(DateOnly date, double latitude, double longitude, string timeZoneId)
    {
        return _byDate[date];
    }

    public static FakeSunCalculator UniformDay(
        DateOnly start,
        DateOnly end,
        TimeOnly sunrise,
        TimeOnly sunset)
    {
        var dict = new Dictionary<DateOnly, SunTimes>();
        for (var d = start; d <= end; d = d.AddDays(1))
        {
            dict[d] = new SunTimes(d.ToDateTime(sunrise), d.ToDateTime(sunset));
        }

        return new FakeSunCalculator(dict);
    }
}
