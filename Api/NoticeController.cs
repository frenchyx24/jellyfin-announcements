using System;
using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Jellyfin.Plugin.NflixNotice.Api;

[ApiController]
[Route("Plugins/NflixNotice")]
public sealed class NoticeController : ControllerBase
{
    private readonly NoticeStore _store;
    public NoticeController() => _store = Plugin.Instance?.Store ?? throw new InvalidOperationException("Nflix Notice is not loaded.");

    [HttpGet("Active"), Authorize]
    public IActionResult Active()
    {
        Response.Headers.CacheControl = "no-store";
        return Ok(_store.GetActive(DateTimeOffset.UtcNow));
    }

    [HttpGet("Feed"), Authorize]
    public IActionResult Feed()
    {
        Response.Headers.CacheControl = "no-store";
        return Ok(_store.GetFeed(DateTimeOffset.UtcNow));
    }

    [HttpGet("Admin"), Authorize(Policy = "RequiresElevation")]
    public IActionResult All() => Ok(_store.GetAll());

    [HttpPost("Admin"), Authorize(Policy = "RequiresElevation")]
    public IActionResult Save([FromBody] Notice? notice)
    {
        if (notice is null) return BadRequest("Request body is required.");
        notice.Title = notice.Title?.Trim() ?? string.Empty;
        notice.Message = notice.Message?.Trim() ?? string.Empty;
        if (notice.Title.Length is 0 or > 120) return BadRequest("Title must contain 1 to 120 characters.");
        if (notice.Message.Length is 0 or > 10000) return BadRequest("Le message doit contenir entre 1 et 10 000 caractères.");
        if (notice.Category is not ("announcement" or "update" or "maintenance" or "incident")) return BadRequest("Catégorie inconnue.");
        notice.Version = notice.Version?.Trim() ?? string.Empty;
        notice.ActionLabel = notice.ActionLabel?.Trim() ?? string.Empty;
        notice.ActionUrl = notice.ActionUrl?.Trim() ?? string.Empty;
        if (notice.Version.Length > 80 || notice.ActionLabel.Length > 80 || notice.ActionUrl.Length > 2048) return BadRequest("Version ou lien trop long.");
        if (notice.ActionUrl.Length > 0 && (!Uri.TryCreate(notice.ActionUrl, UriKind.Absolute, out var uri) || uri.Scheme is not ("http" or "https"))) return BadRequest("Le lien doit être une URL HTTP ou HTTPS.");
        if (notice.Level is not ("info" or "warning" or "urgent")) return BadRequest("Level must be info, warning, or urgent.");
        if (notice.EndsAt.HasValue && notice.EndsAt <= notice.StartsAt) return BadRequest("End time must follow start time.");
        if (notice.Id == Guid.Empty) notice.Id = Guid.NewGuid();
        return Ok(_store.Save(notice));
    }

    [HttpDelete("Admin/{id:guid}"), Authorize(Policy = "RequiresElevation")]
    public IActionResult Delete(Guid id) => _store.Delete(id) ? NoContent() : NotFound();

    [HttpGet("client.js"), AllowAnonymous]
    public IActionResult ClientScript() => Embedded("Jellyfin.Plugin.NflixNotice.Web.client.js", "application/javascript; charset=utf-8");

    [HttpGet("admin.js"), AllowAnonymous]
    public IActionResult AdminScript() => Embedded("Jellyfin.Plugin.NflixNotice.Web.admin.js", "application/javascript; charset=utf-8");

    [HttpGet("notice.css"), AllowAnonymous]
    public IActionResult Styles() => Embedded("Jellyfin.Plugin.NflixNotice.Web.notice.css", "text/css; charset=utf-8");

    private IActionResult Embedded(string name, string contentType)
    {
        Response.Headers.CacheControl = "no-store";
        var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(name);
        return stream is null ? NotFound() : File(stream, contentType);
    }
}