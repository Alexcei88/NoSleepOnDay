namespace NoSleepOnDay.Api.Contracts;

public sealed record RegionDto(
    string Id,
    string Iso2,
    string Name,
    double Latitude,
    double Longitude,
    string TimeZone);
