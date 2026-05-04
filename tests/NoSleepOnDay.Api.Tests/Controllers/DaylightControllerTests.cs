using System.Net;
using System.Net.Http.Json;
using AwesomeAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using NoSleepOnDay.Api.Contracts;

namespace NoSleepOnDay.Api.Tests.Controllers;

public class DaylightControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public DaylightControllerTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Happy_path_returns_full_analysis_for_kirov_year()
    {
        var response = await _client.GetAsync("/api/daylight/analysis?regionId=kirov&periodType=year&year=2026");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var dto = await response.Content.ReadFromJsonAsync<AnalysisResultDto>();
        dto.Should().NotBeNull();
        dto!.Region.Id.Should().Be("kirov");
        dto.Period.Type.Should().Be("year");
        dto.Period.Year.Should().Be(2026);
        dto.WakeWindow.WakeTime.Should().Be("06:00");
        dto.WakeWindow.SleepTime.Should().Be("22:00");
        dto.WakeWindow.SleepHours.Should().Be(8.0);
        dto.Series.Should().HaveCount(365);
        dto.Current.TotalDaylightMinutes.Should().BeGreaterThan(0);
        dto.Shifted.TotalDaylightMinutes.Should().BeGreaterThan(dto.Current.TotalDaylightMinutes);
        dto.Delta.TotalGainMinutes.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task Quarter_request_returns_only_that_quarter()
    {
        var response = await _client.GetAsync(
            "/api/daylight/analysis?regionId=kirov&periodType=quarter&year=2026&quarter=1");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var dto = await response.Content.ReadFromJsonAsync<AnalysisResultDto>();
        dto!.Period.Type.Should().Be("quarter");
        dto.Period.Quarter.Should().Be(1);
        dto.Series.Should().HaveCount(90);
        dto.Period.StartDate.Should().Be("2026-01-01");
        dto.Period.EndDate.Should().Be("2026-03-31");
    }

    [Fact]
    public async Task Custom_wakeTime_and_sleepHours_are_applied()
    {
        var response = await _client.GetAsync(
            "/api/daylight/analysis?regionId=kirov&periodType=year&year=2026&wakeTime=07:30&sleepHours=9");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var dto = await response.Content.ReadFromJsonAsync<AnalysisResultDto>();
        dto!.WakeWindow.WakeTime.Should().Be("07:30");
        dto.WakeWindow.SleepTime.Should().Be("22:30");
        dto.WakeWindow.SleepHours.Should().Be(9.0);
    }

    [Fact]
    public async Task Unknown_region_returns_404()
    {
        var response = await _client.GetAsync("/api/daylight/analysis?regionId=mars&periodType=year&year=2026");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Quarter_period_without_quarter_argument_returns_400()
    {
        var response = await _client.GetAsync(
            "/api/daylight/analysis?regionId=kirov&periodType=quarter&year=2026");
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Quarter_5_returns_400()
    {
        var response = await _client.GetAsync(
            "/api/daylight/analysis?regionId=kirov&periodType=quarter&year=2026&quarter=5");
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task WakeTime_03_00_returns_400()
    {
        var response = await _client.GetAsync(
            "/api/daylight/analysis?regionId=kirov&periodType=year&year=2026&wakeTime=03:00");
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task SleepHours_7_returns_400()
    {
        var response = await _client.GetAsync(
            "/api/daylight/analysis?regionId=kirov&periodType=year&year=2026&sleepHours=7");
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Garbage_periodType_returns_400()
    {
        var response = await _client.GetAsync(
            "/api/daylight/analysis?regionId=kirov&periodType=decade&year=2026");
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(3)]
    [InlineData(-3)]
    [InlineData(10)]
    public async Task Disallowed_shiftHours_returns_400(int shiftHours)
    {
        var response = await _client.GetAsync(
            $"/api/daylight/analysis?regionId=kirov&periodType=year&year=2026&shiftHours={shiftHours}");
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Theory]
    [InlineData(-2)]
    [InlineData(-1)]
    [InlineData(1)]
    [InlineData(2)]
    public async Task Allowed_shiftHours_return_200(int shiftHours)
    {
        var response = await _client.GetAsync(
            $"/api/daylight/analysis?regionId=kirov&periodType=year&year=2026&shiftHours={shiftHours}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
