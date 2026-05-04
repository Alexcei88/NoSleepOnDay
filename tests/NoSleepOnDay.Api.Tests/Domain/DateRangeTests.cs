using AwesomeAssertions;
using NoSleepOnDay.Api.Domain;

namespace NoSleepOnDay.Api.Tests.Domain;

public class DateRangeTests
{
    [Fact]
    public void Year_2026_spans_jan_1_to_dec_31()
    {
        var range = DateRange.ForYear(2026);

        range.Start.Should().Be(new DateOnly(2026, 1, 1));
        range.End.Should().Be(new DateOnly(2026, 12, 31));
        range.DayCount.Should().Be(365);
    }

    [Fact]
    public void Leap_year_2024_has_366_days()
    {
        var range = DateRange.ForYear(2024);

        range.DayCount.Should().Be(366);
    }

    [Theory]
    [InlineData(1, "2026-01-01", "2026-03-31")]
    [InlineData(2, "2026-04-01", "2026-06-30")]
    [InlineData(3, "2026-07-01", "2026-09-30")]
    [InlineData(4, "2026-10-01", "2026-12-31")]
    public void Quarters_have_expected_boundaries(int quarter, string expectedStart, string expectedEnd)
    {
        var range = DateRange.ForQuarter(2026, quarter);

        range.Start.Should().Be(DateOnly.Parse(expectedStart));
        range.End.Should().Be(DateOnly.Parse(expectedEnd));
    }

    [Fact]
    public void Q1_in_leap_year_includes_feb_29()
    {
        var range = DateRange.ForQuarter(2024, 1);

        range.DayCount.Should().Be(91);
        range.End.Should().Be(new DateOnly(2024, 3, 31));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(5)]
    [InlineData(-1)]
    public void Invalid_quarter_is_rejected(int quarter)
    {
        var act = () => DateRange.ForQuarter(2026, quarter);

        act.Should()
            .Throw<ArgumentOutOfRangeException>()
            .Which.ParamName.Should().Be("quarter");
    }

    [Fact]
    public void Build_with_year_type_uses_full_year()
    {
        var range = DateRange.Build(PeriodType.Year, 2026, null);

        range.Should().Be(DateRange.ForYear(2026));
    }

    [Fact]
    public void Build_with_quarter_type_requires_quarter_argument()
    {
        var act = () => DateRange.Build(PeriodType.Quarter, 2026, null);

        act.Should()
            .Throw<ArgumentNullException>()
            .Which.ParamName.Should().Be("quarter");
    }

    [Fact]
    public void Enumerate_days_yields_all_dates_inclusive()
    {
        var range = DateRange.ForQuarter(2026, 1);

        var days = range.EnumerateDays().ToList();

        days.Should().HaveCount(range.DayCount);
        days.First().Should().Be(range.Start);
        days.Last().Should().Be(range.End);
    }
}
