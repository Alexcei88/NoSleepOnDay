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
            new OptimalScheduleDto(
                result.Optimal.WakeTime.ToString(TimeFormat),
                result.Optimal.SleepTime.ToString(TimeFormat),
                result.Optimal.TotalDaylightMinutes,
                result.Optimal.AvgDaylightPerDay,
                result.Optimal.ClampedToBounds),
            result.Series
                .Select(p => new DaylightSeriesPointDto(
                    p.Date.ToString(DateFormat),
                    p.CurrentMinutes,
                    p.ShiftedMinutes))
                .ToList());
    }
}
