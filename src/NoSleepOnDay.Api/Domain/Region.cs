namespace NoSleepOnDay.Api.Domain;

public sealed record Region(
    string Id,
    string Name,
    double Latitude,
    double Longitude,
    string TimeZoneId);
