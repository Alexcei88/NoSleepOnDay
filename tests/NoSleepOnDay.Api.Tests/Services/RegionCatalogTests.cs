using AwesomeAssertions;
using NoSleepOnDay.Api.Services;

namespace NoSleepOnDay.Api.Tests.Services;

public class RegionCatalogTests
{
    private readonly IRegionCatalog _catalog = new RegionCatalog();

    [Fact]
    public void Catalog_contains_kirov_for_mvp()
    {
        _catalog.All.Should().HaveCount(1);
        _catalog.All[0].Id.Should().Be("kirov");
        _catalog.All[0].Name.Should().Be("Кировская область");
    }

    [Fact]
    public void FindById_returns_kirov_for_known_id()
    {
        var region = _catalog.FindById("kirov");

        region.Should().NotBeNull();
        region!.TimeZoneId.Should().Be("Europe/Kirov");
    }

    [Fact]
    public void FindById_is_case_insensitive()
    {
        _catalog.FindById("KIROV").Should().NotBeNull();
        _catalog.FindById("Kirov").Should().NotBeNull();
    }

    [Fact]
    public void FindById_returns_null_for_unknown_region()
    {
        _catalog.FindById("moscow").Should().BeNull();
    }
}
