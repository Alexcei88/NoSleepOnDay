using Microsoft.AspNetCore.Mvc;
using NoSleepOnDay.Api.Contracts;
using NoSleepOnDay.Api.Services;

namespace NoSleepOnDay.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class RegionsController : ControllerBase
{
    private readonly IRegionCatalog _catalog;

    public RegionsController(IRegionCatalog catalog)
    {
        _catalog = catalog;
    }

    [HttpGet]
    [ProducesResponseType<IReadOnlyList<RegionDto>>(StatusCodes.Status200OK)]
    public ActionResult<IReadOnlyList<RegionDto>> GetAll()
    {
        var dtos = _catalog.All.Select(r => r.ToDto()).ToList();
        return Ok(dtos);
    }
}
