namespace NoSleepOnDay.Api.Domain;

public sealed record AnalysisResult(
    Region Region,
    AnalysisPeriod Period,
    WakeWindow WakeWindow,
    int ShiftHours,
    DaylightAggregate Current,
    DaylightAggregate Shifted,
    DaylightDelta Delta,
    OptimalSchedule Optimal,
    OptimalSchedule OptimalShifted,
    IReadOnlyList<DaylightSeriesPoint> Series);

public sealed record AnalysisPeriod(
    PeriodType Type,
    int Year,
    int? Quarter,
    DateOnly StartDate,
    DateOnly EndDate);

public sealed record DaylightAggregate(int TotalDaylightMinutes, int AvgDaylightPerDay);

public sealed record DaylightDelta(int TotalGainMinutes, int AvgGainPerDay);

public sealed record OptimalSchedule(
    TimeOnly WakeTime,
    TimeOnly SleepTime,
    int TotalDaylightMinutes,
    int AvgDaylightPerDay,
    bool ClampedToBounds);
