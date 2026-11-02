using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;

namespace Jellyfin.Plugin.NflixNotice;

public sealed class NoticeStore
{
    private readonly object _gate = new();
    private readonly string _path;
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };

    public NoticeStore(string path)
    {
        _path = path;
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
    }

    public IReadOnlyList<Notice> GetAll()
    {
        lock (_gate) return Load();
    }

    public IReadOnlyList<Notice> GetActive(DateTimeOffset now)
    {
        lock (_gate) return Load().Where(n => n.Enabled && n.StartsAt <= now && (!n.EndsAt.HasValue || n.EndsAt > now)).OrderByDescending(n => n.CreatedAt).ToArray();
    }

    public Notice Save(Notice notice)
    {
        lock (_gate)
        {
            var all = Load();
            var index = all.FindIndex(n => n.Id == notice.Id);
            if (index < 0) all.Add(notice); else all[index] = notice;
            Persist(all);
            return notice;
        }
    }

    public bool Delete(Guid id)
    {
        lock (_gate)
        {
            var all = Load();
            if (all.RemoveAll(n => n.Id == id) == 0) return false;
            Persist(all);
            return true;
        }
    }

    private List<Notice> Load()
    {
        if (!File.Exists(_path)) return new List<Notice>();
        try { return JsonSerializer.Deserialize<List<Notice>>(File.ReadAllText(_path)) ?? new List<Notice>(); }
        catch (JsonException ex) { throw new InvalidDataException("Announcement data is invalid; preserve the file before recovery.", ex); }
    }

    private void Persist(List<Notice> notices)
    {
        var temp = _path + ".tmp";
        File.WriteAllText(temp, JsonSerializer.Serialize(notices, JsonOptions));
        File.Move(temp, _path, true);
    }
}