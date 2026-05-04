namespace NoSleepOnDay.Api.Contracts;

public sealed record AnalysisResultDto(
    RegionDto Region,
    PeriodDto Period,
    WakeWindowDto WakeWindow,
    int ShiftHours,
    DaylightAggregateDto Current,
    DaylightAggregateDto Shifted,
    DaylightDeltaDto Delta,
    OptimalScheduleDto Optimal,
    IReadOnlyList<DaylightSeriesPointDto> Series);

public sealed record PeriodDto(
    string Type,
    int Year,
    int? Quarter,
    string StartDate,
    string EndDate);

public sealed record WakeWindowDto(
    string WakeTime,
    string SleepTime,
    double SleepHours);

public sealed record DaylightAggregateDto(
    int TotalDaylightMinutes,
    int AvgDaylightPerDay);

public sealed record DaylightDeltaDto(
    int TotalGainMinutes,
    int AvgGainPerDay);

public sealed record OptimalScheduleDto(
    string WakeTime,
    string SleepTime,
    int TotalDaylightMinutes,
    int AvgDaylightPerDay,
    bool ClampedToBounds);

public sealed record DaylightSeriesPointDto(
    string Date,
    int CurrentMinutes,
    int ShiftedMinutes);
