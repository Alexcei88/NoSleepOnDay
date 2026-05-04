using AwesomeAssertions;
using NoSleepOnDay.Api.Services;

namespace NoSleepOnDay.Api.Tests.Services;

public class SunCalculatorTests
{
    private readonly ISunCalculator _calculator = new SunCalculator();

    [Fact]
    public void Moscow_summer_solstice_has_long_day_and_early_sunrise()
    {
        var times = _calculator.GetSunTimes(
            new DateOnly(2026, 6, 21),
            55.7558,
            37.6173,
            "Europe/Moscow");

        times.SunriseLocal.TimeOfDay.Should().BeGreaterThan(new TimeSpan(3, 30, 0));
        times.SunriseLocal.TimeOfDay.Should().BeLessThan(new TimeSpan(4, 30, 0));

        times.SunsetLocal.TimeOfDay.Should().BeGreaterThan(new TimeSpan(20, 30, 0));
        times.SunsetLocal.TimeOfDay.Should().BeLessThan(new TimeSpan(21, 30, 0));

        var dayLength = times.SunsetLocal - times.SunriseLocal;
        dayLength.TotalHours.Should().BeApproximately(17.5, 0.5);
    }

    [Fact]
    public void Kirov_winter_solstice_has_short_day_with_early_sunset_documenting_the_problem()
    {
        var times = _calculator.GetSunTimes(
            new DateOnly(2026, 12, 21),
            58.6035,
            49.6680,
            "Europe/Kirov");

        times.SunriseLocal.TimeOfDay.Should().BeGreaterThan(new TimeSpan(8, 0, 0));
        times.SunriseLocal.TimeOfDay.Should().BeLessThan(new TimeSpan(9, 0, 0));

        times.SunsetLocal.TimeOfDay.Should().BeGreaterThan(new TimeSpan(14, 30, 0));
        times.SunsetLocal.TimeOfDay.Should().BeLessThan(new TimeSpan(15, 30, 0));

        var dayLength = times.SunsetLocal - times.SunriseLocal;
        dayLength.TotalHours.Should().BeLessThan(7.0);
        dayLength.TotalHours.Should().BeGreaterThan(5.5);
    }

    [Fact]
    public void Kirov_summer_solstice_has_very_early_sunrise_documenting_the_problem()
    {
        var times = _calculator.GetSunTimes(
            new DateOnly(2026, 6, 21),
            58.6035,
            49.6680,
            "Europe/Kirov");

        times.SunriseLocal.TimeOfDay.Should().BeGreaterThan(new TimeSpan(2, 0, 0));
        times.SunriseLocal.TimeOfDay.Should().BeLessThan(new TimeSpan(3, 30, 0));
    }

    [Fact]
    public void Kirov_equinox_has_roughly_12_hour_day()
    {
        var times = _calculator.GetSunTimes(
            new DateOnly(2026, 3, 20),
            58.6035,
            49.6680,
            "Europe/Kirov");

        var dayLength = times.SunsetLocal - times.SunriseLocal;
        dayLength.TotalHours.Should().BeApproximately(12.0, 0.5);
    }

    [Fact]
    public void Sunrise_is_before_sunset()
    {
        var times = _calculator.GetSunTimes(
            new DateOnly(2026, 7, 1),
            58.6035,
            49.6680,
            "Europe/Kirov");

        times.SunriseLocal.Should().BeBefore(times.SunsetLocal);
    }
}
