namespace Nexus.Gateway.Models;

public class FileSourceModel
{
    public string Name { get; set; } = string.Empty; // e.g. "C:" or "navishare"
    public string Type { get; set; } = string.Empty; // "Disk" or "Share"
    public string Path { get; set; } = string.Empty; // e.g. "\\\\dc\\C$" or "\\\\dc\\navishare"
}

public class FileItemModel
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // "folder", "ps1", "txt", etc.
    public long Size { get; set; } // Size in bytes
    public string Modified { get; set; } = string.Empty; // "2026-06-15 14:21"
    public string Attrs { get; set; } = string.Empty; // "D----"
}
