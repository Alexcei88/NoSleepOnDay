using NoSleepOnDay.Api.Domain;

namespace NoSleepOnDay.Api.Services;

public interface IRegionCatalog
{
    IReadOnlyList<Region> All { get; }

    Region? FindById(string id);
}
