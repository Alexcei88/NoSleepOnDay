using AwesomeAssertions;
using NoSleepOnDay.Api.Domain;

namespace NoSleepOnDay.Api.Tests.Domain;

public class WakeWindowTests
{
    [Fact]
    public void Default_06_00_with_8h_sleep_yields_22_00_sleep_time_and_16h_window()
    {
        var window = new WakeWindow(new TimeOnly(6, 0), 8.0);

        window.SleepTime.Should().Be(new TimeOnly(22, 0));
        window.WindowDuration.Should().Be(TimeSpan.FromHours(16));
    }

    [Fact]
    public void Sleep_hours_10_yields_14h_window_and_20_00_sleep_time()
    {
        var window = new WakeWindow(new TimeOnly(6, 0), 10.0);

        window.SleepTime.Should().Be(new TimeOnly(20, 0));
        window.WindowDuration.Should().Be(TimeSpan.FromHours(14));
    }

    [Theory]
    [InlineData(3, 30)]
    [InlineData(10, 15)]
    [InlineData(0, 0)]
    [InlineData(23, 45)]
    public void Wake_time_outside_04_00_to_10_00_is_rejected(int hour, int minute)
    {
        var act = () => new WakeWindow(new TimeOnly(hour, minute), 8.0);

        act.Should()
            .Throw<ArgumentOutOfRangeException>()
            .Which.ParamName.Should().Be("wakeTime");
    }

    [Theory]
    [InlineData(6, 7)]
    [InlineData(7, 1)]
    [InlineData(9, 22)]
    public void Wake_time_not_aligned_to_15_minute_step_is_rejected(int hour, int minute)
    {
        var act = () => new WakeWindow(new TimeOnly(hour, minute), 8.0);

        act.Should()
            .Throw<ArgumentOutOfRangeException>()
            .Which.ParamName.Should().Be("wakeTime");
    }

    [Theory]
    [InlineData(7.5)]
    [InlineData(10.5)]
    [InlineData(0.0)]
    public void Sleep_hours_outside_8_to_10_is_rejected(double sleepHours)
    {
        var act = () => new WakeWindow(new TimeOnly(6, 0), sleepHours);

        act.Should()
            .Throw<ArgumentOutOfRangeException>()
            .Which.ParamName.Should().Be("sleepHours");
    }

    [Theory]
    [InlineData(8.25)]
    [InlineData(9.1)]
    [InlineData(8.7)]
    public void Sleep_hours_not_aligned_to_half_hour_step_is_rejected(double sleepHours)
    {
        var act = () => new WakeWindow(new TimeOnly(6, 0), sleepHours);

        act.Should()
            .Throw<ArgumentOutOfRangeException>()
            .Which.ParamName.Should().Be("sleepHours");
    }

    [Theory]
    [InlineData(8.0)]
    [InlineData(8.5)]
    [InlineData(9.0)]
    [InlineData(9.5)]
    [InlineData(10.0)]
    public void All_5_valid_sleep_hour_values_are_accepted(double sleepHours)
    {
        var act = () => new WakeWindow(new TimeOnly(6, 0), sleepHours);

        act.Should().NotThrow();
    }
}
