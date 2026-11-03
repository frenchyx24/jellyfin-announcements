using System;

namespace Jellyfin.Plugin.NflixNotice;

public sealed class Notice
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Category { get; set; } = "announcement";
    public string Level { get; set; } = "info";
    public string Version { get; set; } = string.Empty;
    public string ActionLabel { get; set; } = string.Empty;
    public string ActionUrl { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }
    public DateTimeOffset StartsAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? EndsAt { get; set; }
    public bool Enabled { get; set; } = true;
    public bool Dismissible { get; set; } = true;
    public bool ShowPopup { get; set; } = true;
    public bool Pinned { get; set; }
    public bool Archived { get; set; }
}
