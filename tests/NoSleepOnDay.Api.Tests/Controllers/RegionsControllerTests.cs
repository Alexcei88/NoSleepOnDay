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
    public async Task Get_returns_200_with_kirov_in_the_list()
    {
        var response = await _client.GetAsync("/api/regions");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var regions = await response.Content.ReadFromJsonAsync<IReadOnlyList<RegionDto>>();

        regions.Should().NotBeNull();
        regions!.Should().HaveCount(1);
        regions[0].Id.Should().Be("kirov");
        regions[0].Name.Should().Be("Кировская область");
        regions[0].TimeZone.Should().Be("Europe/Kirov");
    }
}
