using AwesomeAssertions;
using NoSleepOnDay.Api.Contracts;
using NoSleepOnDay.Api.Domain;

namespace NoSleepOnDay.Api.Tests.Contracts;

public class ContractMapperTests
{
    [Fact]
    public void Region_maps_to_dto_with_iana_timezone()
    {
        var region = new Region("kirov", "Кировская область", 58.6035, 49.6680, "Europe/Kirov");

        var dto = region.ToDto();

        dto.Should().Be(new RegionDto("kirov", "Кировская область", 58.6035, 49.6680, "Europe/Kirov"));
    }

    [Fact]
    public void AnalysisResult_maps_to_dto_with_formatted_dates_and_times()
    {
        var region = new Region("kirov", "Кировская область", 58.6035, 49.6680, "Europe/Kirov");
        var period = new AnalysisPeriod(
            PeriodType.Year,
            2026,
            null,
            new DateOnly(2026, 1, 1),
            new DateOnly(2026, 12, 31));
        var window = new WakeWindow(new TimeOnly(6, 0), 8.0);
        var result = new AnalysisResult(
            region,
            period,
            window,
            1,
            new DaylightAggregate(24720, 67),
            new DaylightAggregate(28680, 78),
            new DaylightDelta(3960, 11),
            new OptimalSchedule(new TimeOnly(7, 30), new TimeOnly(23, 30), 30120, 82, false),
            new OptimalSchedule(new TimeOnly(6, 30), new TimeOnly(22, 30), 31200, 85, false),
            new[]
            {
                new DaylightSeriesPoint(
                    new DateOnly(2026, 1, 1),
                    new TimeOnly(8, 30),
                    new TimeOnly(16, 0),
                    450,
                    32,
                    47),
            });

        var dto = result.ToDto();

        dto.Period.Type.Should().Be("year");
        dto.Period.StartDate.Should().Be("2026-01-01");
        dto.Period.EndDate.Should().Be("2026-12-31");
        dto.WakeWindow.WakeTime.Should().Be("06:00");
        dto.WakeWindow.SleepTime.Should().Be("22:00");
        dto.WakeWindow.SleepHours.Should().Be(8.0);
        dto.Optimal.WakeTime.Should().Be("07:30");
        dto.Optimal.SleepTime.Should().Be("23:30");
        dto.OptimalShifted.WakeTime.Should().Be("06:30");
        dto.OptimalShifted.SleepTime.Should().Be("22:30");
        dto.OptimalShifted.AvgDaylightPerDay.Should().Be(85);
        dto.Series.Should().HaveCount(1);
        dto.Series[0].Date.Should().Be("2026-01-01");
        dto.Series[0].SunriseLocal.Should().Be("08:30");
        dto.Series[0].SunsetLocal.Should().Be("16:00");
        dto.Series[0].DayLengthMinutes.Should().Be(450);
        dto.Current.TotalDaylightMinutes.Should().Be(24720);
        dto.Delta.TotalGainMinutes.Should().Be(3960);
    }
}
