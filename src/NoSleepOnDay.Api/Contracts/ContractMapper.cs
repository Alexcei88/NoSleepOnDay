using NoSleepOnDay.Api.Domain;

namespace NoSleepOnDay.Api.Contracts;

public static class ContractMapper
{
    private const string TimeFormat = "HH:mm";
    private const string DateFormat = "yyyy-MM-dd";

    public static RegionDto ToDto(this Region region)
    {
        return new RegionDto(
            region.Id,
            region.Name,
            region.Latitude,
            region.Longitude,
            region.TimeZoneId);
    }

    private static OptimalScheduleDto ToDto(OptimalSchedule schedule)
    {
        return new OptimalScheduleDto(
            schedule.WakeTime.ToString(TimeFormat),
            schedule.SleepTime.ToString(TimeFormat),
            schedule.TotalDaylightMinutes,
            schedule.AvgDaylightPerDay,
            schedule.ClampedToBounds);
    }

    public static AnalysisResultDto ToDto(this AnalysisResult result)
    {
        return new AnalysisResultDto(
            result.Region.ToDto(),
            new PeriodDto(
                result.Period.Type.ToString().ToLowerInvariant(),
                result.Period.Year,
                result.Period.Quarter,
                result.Period.StartDate.ToString(DateFormat),
                result.Period.EndDate.ToString(DateFormat)),
            new WakeWindowDto(
                result.WakeWindow.WakeTime.ToString(TimeFormat),
                result.WakeWindow.SleepTime.ToString(TimeFormat),
                result.WakeWindow.SleepHours),
            result.ShiftHours,
            new DaylightAggregateDto(
                result.Current.TotalDaylightMinutes,
                result.Current.AvgDaylightPerDay),
            new DaylightAggregateDto(
                result.Shifted.TotalDaylightMinutes,
                result.Shifted.AvgDaylightPerDay),
            new DaylightDeltaDto(
                result.Delta.TotalGainMinutes,
                result.Delta.AvgGainPerDay),
            ToDto(result.Optimal),
            ToDto(result.OptimalShifted),
            result.Series
                .Select(p => new DaylightSeriesPointDto(
                    p.Date.ToString(DateFormat),
                    p.CurrentMinutes,
                    p.ShiftedMinutes))
                .ToList());
    }
}
