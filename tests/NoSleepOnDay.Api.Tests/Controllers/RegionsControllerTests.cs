using System.Net;
using System.Net.Http.Json;
using AwesomeAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using NoSleepOnDay.Api.Contracts;

namespace NoSleepOnDay.Api.Tests.Controllers;

public class RegionsControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public RegionsControllerTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Get_returns_200_with_full_catalog()
    {
        var response = await _client.GetAsync("/api/regions");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var regions = await response.Content.ReadFromJsonAsync<IReadOnlyList<RegionDto>>();

        regions.Should().NotBeNull();
        regions!.Should().HaveCount(85);

        var kirov = regions.SingleOrDefault(r => r.Id == "kirov");
        kirov.Should().NotBeNull();
        kirov!.Iso2.Should().Be("KIR");
        kirov.Name.Should().Be("Кировская область");
        kirov.TimeZone.Should().Be("Europe/Kirov");
    }

    [Fact]
    public async Task Get_returns_unique_iso2_for_every_region()
    {
        var response = await _client.GetAsync("/api/regions");
        var regions = await response.Content.ReadFromJsonAsync<IReadOnlyList<RegionDto>>();

        regions!.Select(r => r.Iso2).Should().OnlyHaveUniqueItems();
    }
}
