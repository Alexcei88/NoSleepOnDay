using NoSleepOnDay.Api.Domain;

namespace NoSleepOnDay.Api.Services;

public sealed class RegionCatalog : IRegionCatalog
{
    private static readonly IReadOnlyList<Region> Regions =
    [
        new Region("kirov", "Кировская область", 58.6035, 49.6680, "Europe/Kirov"),
    ];

    private static readonly IReadOnlyDictionary<string, Region> ById = Regions.ToDictionary(
        r => r.Id,
        StringComparer.OrdinalIgnoreCase);

    public IReadOnlyList<Region> All => Regions;

    public Region? FindById(string id)
    {
        return ById.TryGetValue(id, out var region) ? region : null;
    }
}
