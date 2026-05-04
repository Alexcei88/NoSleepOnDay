namespace NoSleepOnDay.Api.Contracts;

public sealed record RegionDto(
    string Id,
    string Name,
    double Latitude,
    double Longitude,
    string TimeZone);
