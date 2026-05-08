using AwesomeAssertions;
using NoSleepOnDay.Api.Services;

namespace NoSleepOnDay.Api.Tests.Services;

public class RegionCatalogTests
{
    private readonly IRegionCatalog _catalog = new RegionCatalog();

    [Fact]
    public void Catalog_contains_all_85_federal_subjects()
    {
        _catalog.All.Should().HaveCount(85);
    }

    [Fact]
    public void All_iso2_codes_are_unique()
    {
        var iso2 = _catalog.All.Select(r => r.Iso2).ToList();
        iso2.Should().OnlyHaveUniqueItems();
        iso2.Should().AllSatisfy(c => c.Should().NotBeNullOrWhiteSpace());
    }

    [Fact]
    public void All_ids_are_unique_and_lowercase_slugs()
    {
        var ids = _catalog.All.Select(r => r.Id).ToList();
        ids.Should().OnlyHaveUniqueItems();
        ids.Should().AllSatisfy(id => id.Should().MatchRegex("^[a-z][a-z0-9-]*$"));
    }

    [Fact]
    public void FindById_returns_kirov_for_known_id()
    {
        var region = _catalog.FindById("kirov");

        region.Should().NotBeNull();
        region!.TimeZoneId.Should().Be("Europe/Kirov");
        region.Iso2.Should().Be("KIR");
    }

    [Fact]
    public void FindById_returns_moscow_for_known_id()
    {
        var region = _catalog.FindById("moscow");

        region.Should().NotBeNull();
        region!.Name.Should().Be("Москва");
        region.TimeZoneId.Should().Be("Europe/Moscow");
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
        _catalog.FindById("atlantis").Should().BeNull();
    }

    [Fact]
    public void Catalog_covers_extreme_timezones_from_kaliningrad_to_kamchatka()
    {
        var timeZones = _catalog.All.Select(r => r.TimeZoneId).Distinct().ToList();
        timeZones.Should().Contain("Europe/Kaliningrad");
        timeZones.Should().Contain("Europe/Moscow");
        timeZones.Should().Contain("Asia/Yekaterinburg");
        timeZones.Should().Contain("Asia/Yakutsk");
        timeZones.Should().Contain("Asia/Vladivostok");
        timeZones.Should().Contain("Asia/Kamchatka");
        timeZones.Should().Contain("Asia/Anadyr");
    }
}
