using System;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Jellyfin.Plugin.NflixNotice.Api;

[ApiController]
[Route("Plugins/NflixNotice")]
public sealed class NoticeController : ControllerBase
{
    private readonly NoticeStore _store;
    public NoticeController() => _store = Plugin.Instance?.Store ?? throw new InvalidOperationException("Nflix Notice is not loaded.");

    [HttpGet("Active")]
    [Authorize]
    public IActionResult Active()
    {
        Response.Headers.CacheControl = "no-store";
        return Ok(_store.GetActive(DateTimeOffset.UtcNow));
    }

    [HttpGet("Admin")]
    [Authorize(Policy = "RequiresElevation")]
    public IActionResult All() => Ok(_store.GetAll());

    [HttpPost("Admin")]
    [Authorize(Policy = "RequiresElevation")]
    public IActionResult Save([FromBody] Notice? notice)
    {
        if (notice is null) return BadRequest("Request body is required.");
        notice.Title = notice.Title?.Trim() ?? string.Empty;
        notice.Message = notice.Message?.Trim() ?? string.Empty;
        if (notice.Title.Length is 0 or > 120) return BadRequest("Title must contain 1 to 120 characters.");
        if (notice.Message.Length is 0 or > 2000) return BadRequest("Message must contain 1 to 2000 characters.");
        if (notice.Level is not ("info" or "warning" or "urgent")) return BadRequest("Level must be info, warning, or urgent.");
        if (notice.EndsAt.HasValue && notice.EndsAt <= notice.StartsAt) return BadRequest("End time must follow start time.");
        notice.CreatedAt = DateTimeOffset.UtcNow;
        return Ok(_store.Save(notice));
    }

    [HttpDelete("Admin/{id:guid}")]
    [Authorize(Policy = "RequiresElevation")]
    public IActionResult Delete(Guid id) => _store.Delete(id) ? NoContent() : NotFound();

    [HttpGet("client.js")]
    [AllowAnonymous]
    public IActionResult ClientScript() => Embedded("Jellyfin.Plugin.NflixNotice.Web.client.js", "application/javascript");

    [HttpGet("notice.css")]
    [AllowAnonymous]
    public IActionResult Styles() => Embedded("Jellyfin.Plugin.NflixNotice.Web.notice.css", "text/css");

    private IActionResult Embedded(string name, string contentType)
    {
        var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(name);
        return stream is null ? NotFound() : File(stream, contentType);
    }
}