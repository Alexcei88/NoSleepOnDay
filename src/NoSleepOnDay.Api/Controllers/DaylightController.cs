using Microsoft.AspNetCore.Mvc;
using NoSleepOnDay.Api.Contracts;
using NoSleepOnDay.Api.Domain;
using NoSleepOnDay.Api.Services;

namespace NoSleepOnDay.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class DaylightController : ControllerBase
{
    private readonly IRegionCatalog _catalog;
    private readonly IDaylightAnalysisService _analysis;
    private readonly IHeatmapService _heatmap;

    public DaylightController(
        IRegionCatalog catalog,
        IDaylightAnalysisService analysis,
        IHeatmapService heatmap)
    {
        _catalog = catalog;
        _analysis = analysis;
        _heatmap = heatmap;
    }

    [HttpGet("analysis")]
    [ProducesResponseType<AnalysisResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public ActionResult<AnalysisResultDto> Analyze(
        [FromQuery] string regionId,
        [FromQuery] string periodType,
        [FromQuery] int year,
        [FromQuery] int? quarter = null,
        [FromQuery] string wakeTime = "06:00",
        [FromQuery] double sleepHours = 8.0,
        [FromQuery] int shiftHours = 1)
    {
        if (string.IsNullOrWhiteSpace(regionId))
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid regionId",
                detail: "regionId is required.");
        }

        var region = _catalog.FindById(regionId);
        if (region is null)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Unknown region",
                detail: $"Region '{regionId}' is not in the catalog.");
        }

        if (!Enum.TryParse<PeriodType>(periodType, ignoreCase: true, out var parsedPeriodType))
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid periodType",
                detail: "periodType must be 'year' or 'quarter'.");
        }

        if (parsedPeriodType == PeriodType.Quarter && quarter is null)
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Missing quarter",
                detail: "quarter is required when periodType=quarter.");
        }

        DateRange period;
        try
        {
            period = DateRange.Build(parsedPeriodType, year, quarter);
        }
        catch (ArgumentOutOfRangeException ex)
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid period",
                detail: ex.Message);
        }

        if (!TimeOnly.TryParseExact(wakeTime, "HH:mm", out var parsedWakeTime))
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid wakeTime",
                detail: "wakeTime must be in HH:mm format.");
        }

        WakeWindow window;
        try
        {
            window = new WakeWindow(parsedWakeTime, sleepHours);
        }
        catch (ArgumentOutOfRangeException ex)
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid wakeWindow",
                detail: ex.Message);
        }

        if (shiftHours is not (-2 or -1 or 1 or 2))
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid shiftHours",
                detail: "shiftHours must be one of -2, -1, 1, 2.");
        }

        var result = _analysis.Analyze(region, period, window, shiftHours);
        return Ok(result.ToDto());
    }

    [HttpGet("heatmap")]
    [ProducesResponseType<HeatmapResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public ActionResult<HeatmapResponseDto> Heatmap(
        [FromQuery] int year,
        [FromQuery] int shiftHours = 1,
        [FromQuery] string wakeTime = "06:00",
        [FromQuery] double sleepHours = 8.0)
    {
        DateRange period;
        try
        {
            period = DateRange.Build(PeriodType.Year, year, null);
        }
        catch (ArgumentOutOfRangeException ex)
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid year",
                detail: ex.Message);
        }

        if (!TimeOnly.TryParseExact(wakeTime, "HH:mm", out var parsedWakeTime))
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid wakeTime",
                detail: "wakeTime must be in HH:mm format.");
        }

        WakeWindow window;
        try
        {
            window = new WakeWindow(parsedWakeTime, sleepHours);
        }
        catch (ArgumentOutOfRangeException ex)
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid wakeWindow",
                detail: ex.Message);
        }

        if (shiftHours is not (-2 or -1 or 1 or 2))
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid shiftHours",
                detail: "shiftHours must be one of -2, -1, 1, 2.");
        }

        // period/window — unused here; the service rebuilds them from validated primitives,
        // so 400-валидация уже отработала, а кеш ключи остаются стабильными.
        _ = period;
        _ = window;

        var dto = _heatmap.GetOrCompute(year, shiftHours, parsedWakeTime, sleepHours);
        return Ok(dto);
    }
}
