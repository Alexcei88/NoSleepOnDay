namespace NoSleepOnDay.Api.Domain;

public sealed record Region(
    string Id,
    string Iso2,
    string Name,
    double Latitude,
    double Longitude,
    string TimeZoneId);
