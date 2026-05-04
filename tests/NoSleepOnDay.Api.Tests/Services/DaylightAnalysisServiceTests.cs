using AwesomeAssertions;
using NoSleepOnDay.Api.Domain;
using NoSleepOnDay.Api.Services;

namespace NoSleepOnDay.Api.Tests.Services;

public class DaylightAnalysisServiceTests
{
    private static readonly Region KirovRegion = new(
        "kirov", "Кировская область", 58.6035, 49.6680, "Europe/Kirov");

    [Fact]
    public void When_sun_window_is_inside_wake_window_current_minutes_equals_full_day_length()
    {
        var date = new DateOnly(2026, 1, 15);
        var range = new DateRange(date, date);
        var fake = FakeSunCalculator.UniformDay(date, date, new TimeOnly(8, 0), new TimeOnly(17, 0));
        var sut = new DaylightAnalysisService(fake);

        var result = sut.Analyze(KirovRegion, range, new WakeWindow(new TimeOnly(6, 0), 8.0), shiftHours: 1);

        result.Current.TotalDaylightMinutes.Should().Be(9 * 60);
        result.Series.Should().HaveCount(1);
        result.Series[0].CurrentMinutes.Should().Be(9 * 60);
    }

    [Fact]
    public void When_sunrise_is_before_wake_minutes_are_clipped_at_wake_time()
    {
        var date = new DateOnly(2026, 6, 21);
        var range = new DateRange(date, date);
        var fake = FakeSunCalculator.UniformDay(date, date, new TimeOnly(3, 0), new TimeOnly(21, 0));
        var sut = new DaylightAnalysisService(fake);

        var result = sut.Analyze(KirovRegion, range, new WakeWindow(new TimeOnly(6, 0), 8.0), shiftHours: 1);

        result.Current.TotalDaylightMinutes.Should().Be(15 * 60);
    }

    [Fact]
    public void When_sunset_is_after_sleep_minutes_are_clipped_at_sleep_time()
    {
        var date = new DateOnly(2026, 6, 21);
        var range = new DateRange(date, date);
        var fake = FakeSunCalculator.UniformDay(date, date, new TimeOnly(7, 0), new TimeOnly(23, 0));
        var sut = new DaylightAnalysisService(fake);

        var result = sut.Analyze(KirovRegion, range, new WakeWindow(new TimeOnly(6, 0), 8.0), shiftHours: 1);

        result.Current.TotalDaylightMinutes.Should().Be(15 * 60);
    }

    [Fact]
    public void Shift_plus_one_hour_recovers_an_hour_of_morning_daylight_if_sunrise_was_before_wake()
    {
        var date = new DateOnly(2026, 6, 21);
        var range = new DateRange(date, date);
        var fake = FakeSunCalculator.UniformDay(date, date, new TimeOnly(3, 0), new TimeOnly(20, 0));
        var sut = new DaylightAnalysisService(fake);

        var result = sut.Analyze(KirovRegion, range, new WakeWindow(new TimeOnly(6, 0), 8.0), shiftHours: 1);

        result.Current.TotalDaylightMinutes.Should().Be(14 * 60);
        result.Shifted.TotalDaylightMinutes.Should().Be(15 * 60);
        result.Delta.TotalGainMinutes.Should().Be(60);
    }

    [Fact]
    public void Series_sum_equals_total_aggregate()
    {
        var range = DateRange.ForQuarter(2026, 1);
        var fake = FakeSunCalculator.UniformDay(range.Start, range.End, new TimeOnly(8, 30), new TimeOnly(17, 30));
        var sut = new DaylightAnalysisService(fake);

        var result = sut.Analyze(KirovRegion, range, new WakeWindow(new TimeOnly(6, 0), 8.0), shiftHours: 1);

        result.Series.Should().HaveCount(range.DayCount);
        result.Series.Sum(p => p.CurrentMinutes).Should().Be(result.Current.TotalDaylightMinutes);
        result.Series.Sum(p => p.ShiftedMinutes).Should().Be(result.Shifted.TotalDaylightMinutes);
    }

    [Fact]
    public void Optimal_for_uniform_summer_day_chooses_earliest_wake_to_capture_morning_light()
    {
        var date = new DateOnly(2026, 6, 21);
        var range = new DateRange(date, date);
        var fake = FakeSunCalculator.UniformDay(date, date, new TimeOnly(3, 0), new TimeOnly(20, 0));
        var sut = new DaylightAnalysisService(fake);

        var result = sut.Analyze(KirovRegion, range, new WakeWindow(new TimeOnly(6, 0), 8.0), shiftHours: 1);

        result.Optimal.WakeTime.Should().Be(new TimeOnly(4, 0));
        result.Optimal.ClampedToBounds.Should().BeTrue();
        result.Optimal.SleepTime.Should().Be(new TimeOnly(20, 0));
    }

    [Fact]
    public void Sleep_hours_10_yields_smaller_window_and_typically_less_total_daylight()
    {
        // Sun is [07:00, 21:00] = 14h. With wake=06:00:
        //   - sleep=8h → window [06:00, 22:00], intersection 14h.
        //   - sleep=10h → window [06:00, 20:00], intersection 13h.
        var range = DateRange.ForYear(2026);
        var fake = FakeSunCalculator.UniformDay(range.Start, range.End, new TimeOnly(7, 0), new TimeOnly(21, 0));
        var sut = new DaylightAnalysisService(fake);

        var resultShort = sut.Analyze(KirovRegion, range, new WakeWindow(new TimeOnly(6, 0), 8.0), shiftHours: 1);
        var resultLong = sut.Analyze(KirovRegion, range, new WakeWindow(new TimeOnly(6, 0), 10.0), shiftHours: 1);

        resultLong.Current.TotalDaylightMinutes.Should().BeLessThan(resultShort.Current.TotalDaylightMinutes);
    }

    [Fact]
    public void Period_for_full_year_is_typed_as_year()
    {
        var range = DateRange.ForYear(2026);
        var fake = FakeSunCalculator.UniformDay(range.Start, range.End, new TimeOnly(7, 0), new TimeOnly(20, 0));
        var sut = new DaylightAnalysisService(fake);

        var result = sut.Analyze(KirovRegion, range, new WakeWindow(new TimeOnly(6, 0), 8.0), shiftHours: 1);

        result.Period.Type.Should().Be(PeriodType.Year);
        result.Period.Year.Should().Be(2026);
        result.Period.Quarter.Should().BeNull();
    }

    [Fact]
    public void Period_for_quarter_is_typed_with_quarter_number()
    {
        var range = DateRange.ForQuarter(2026, 3);
        var fake = FakeSunCalculator.UniformDay(range.Start, range.End, new TimeOnly(7, 0), new TimeOnly(20, 0));
        var sut = new DaylightAnalysisService(fake);

        var result = sut.Analyze(KirovRegion, range, new WakeWindow(new TimeOnly(6, 0), 8.0), shiftHours: 1);

        result.Period.Type.Should().Be(PeriodType.Quarter);
        result.Period.Quarter.Should().Be(3);
    }

    [Fact]
    public void Real_kirov_year_with_default_window_finds_an_optimum_later_than_06_00()
    {
        var range = DateRange.ForYear(2026);
        var sut = new DaylightAnalysisService(new SunCalculator());

        var result = sut.Analyze(KirovRegion, range, new WakeWindow(new TimeOnly(6, 0), 8.0), shiftHours: 1);

        result.Series.Should().HaveCount(365);
        result.Current.TotalDaylightMinutes.Should().BeGreaterThan(0);
        result.Shifted.TotalDaylightMinutes.Should().BeGreaterThan(result.Current.TotalDaylightMinutes);
        result.Delta.TotalGainMinutes.Should().BeGreaterThan(0);
        result.Optimal.WakeTime.Should()
            .NotBe(new TimeOnly(6, 0),
                because: "for Kirov, 06:00 wake leaves morning light unused — optimum should differ");
    }
}
