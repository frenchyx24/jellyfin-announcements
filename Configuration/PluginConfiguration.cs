using MediaBrowser.Model.Plugins;

namespace Jellyfin.Plugin.NflixNotice.Configuration;

public sealed class PluginConfiguration : BasePluginConfiguration
{
    public bool EnableClientButton { get; set; } = true;
}