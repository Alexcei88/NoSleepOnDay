using System.Reflection;
using System.Text.Json;
using NoSleepOnDay.Api.Domain;

namespace NoSleepOnDay.Api.Services;

public sealed class RegionCatalog : IRegionCatalog
{
    private static readonly IReadOnlyList<Region> Regions = LoadEmbedded();

    private static readonly IReadOnlyDictionary<string, Region> ById = Regions.ToDictionary(
        r => r.Id,
        StringComparer.OrdinalIgnoreCase);

    public IReadOnlyList<Region> All => Regions;

    public Region? FindById(string id)
    {
        return ById.TryGetValue(id, out var region) ? region : null;
    }

    private static IReadOnlyList<Region> LoadEmbedded()
    {
        var assembly = typeof(RegionCatalog).Assembly;
        var resourceName = $"{assembly.GetName().Name}.Data.regions.json";
        using var stream = assembly.GetManifestResourceStream(resourceName)
            ?? throw new InvalidOperationException($"Embedded resource '{resourceName}' not found.");
        var data = JsonSerializer.Deserialize<RegionData[]>(
            stream,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? throw new InvalidOperationException("regions.json is empty or malformed.");

        return data
            .Select(d => new Region(d.Id, d.Iso2, d.Name, d.Latitude, d.Longitude, d.TimeZoneId))
            .ToArray();
    }

    private sealed record RegionData(
        string Id,
        string Iso2,
        string Name,
        double Latitude,
        double Longitude,
        string TimeZoneId);
}
