using System;
using System.Collections.Generic;
using System.IO;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Model.Plugins;
using Jellyfin.Plugin.NflixNotice.Configuration;
using MediaBrowser.Model.Serialization;

namespace Jellyfin.Plugin.NflixNotice;

public sealed class Plugin : BasePlugin<PluginConfiguration>, IHasWebPages
{
    public static Plugin? Instance { get; private set; }
    public NoticeStore Store { get; }

    public Plugin(IApplicationPaths paths, IXmlSerializer serializer) : base(paths, serializer)
    {
        Instance = this;
        var directory = Path.Combine(paths.DataPath, "plugins", "NflixNotice");
        Store = new NoticeStore(Path.Combine(directory, "notices.json"));
    }

    public override string Name => "Nflix Notice";
    public override Guid Id => Guid.Parse("a7c3b3b7-2b1b-4d16-9ad8-a0d7e510ce31");

    public IEnumerable<PluginPageInfo> GetPages() => new[]
    {
        new PluginPageInfo
        {
            Name = "nflixnotice-admin.html",
            EmbeddedResourcePath = "Jellyfin.Plugin.NflixNotice.Web.admin.html"
        }
    };
}