namespace Nexus.Gateway.Models;

public class LocalUserModel
{
    public string Name { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string LastLogin { get; set; } = string.Empty;
    public bool Enabled { get; set; }
    public bool PasswordNeverExpires { get; set; }
    public List<string> Groups { get; set; } = new();
}
