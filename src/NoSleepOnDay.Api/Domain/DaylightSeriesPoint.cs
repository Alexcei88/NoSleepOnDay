namespace NoSleepOnDay.Api.Domain;

public sealed record DaylightSeriesPoint(
    DateOnly Date,
    TimeOnly SunriseLocal,
    TimeOnly SunsetLocal,
    int DayLengthMinutes,
    int CurrentMinutes,
    int ShiftedMinutes);
