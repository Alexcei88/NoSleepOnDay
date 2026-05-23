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
    OptimalScheduleDto OptimalShifted,
    IReadOnlyList<DaylightSeriesPointDto> Series,
    IReadOnlyList<ShiftNeighborDto> ShiftNeighbors);

public sealed record ShiftNeighborDto(int ShiftHours, int TotalGainMinutes, int AvgGainPerDay);

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
    string SunriseLocal,
    string SunsetLocal,
    int DayLengthMinutes,
    int CurrentMinutes,
    int ShiftedMinutes);

public sealed record HeatmapPointDto(
    string RegionId,
    string Iso2,
    string RegionName,
    int TotalGainMinutes,
    int AvgGainPerDay);

public sealed record HeatmapResponseDto(
    int Year,
    int ShiftHours,
    string WakeTime,
    double SleepHours,
    IReadOnlyList<HeatmapPointDto> Regions);
