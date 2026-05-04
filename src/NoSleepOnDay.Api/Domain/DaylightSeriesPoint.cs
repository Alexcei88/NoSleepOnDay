namespace NoSleepOnDay.Api.Domain;

public sealed record DaylightSeriesPoint(
    DateOnly Date,
    int CurrentMinutes,
    int ShiftedMinutes);
