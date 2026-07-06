namespace Nexus.Gateway.Models;

public class WindowsUpdateEntity
{
    public int Id { get; set; }
    public string ServerIp { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public long MaxDownloadSize { get; set; }
}

public class WindowsUpdateModel
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public long MaxDownloadSize { get; set; }
}

public class InstallUpdatesRequest
{
    public List<string> UpdateTitles { get; set; } = new();
}
