using Microsoft.AspNetCore.Mvc;
using System.Net.WebSockets;
using System.Threading;
using System.Threading.Tasks;
using System.Text;
using System;
using System.Text.RegularExpressions;
using Porta.Pty;

namespace Nexus.Gateway.Controllers;

[ApiController]
[Route("api/terminal")]
[Microsoft.AspNetCore.Authorization.Authorize]
public class TerminalController : ControllerBase
{
    // Validate serverId is a safe hostname/IP — blocks shell metacharacters and injection
    private static readonly Regex SafeServerId = new(@"^[a-zA-Z0-9._-]+$", RegexOptions.Compiled);

    [HttpGet("ws")]
    public async Task Connect([FromQuery] string serverId)
    {
        if (string.IsNullOrEmpty(serverId) || !SafeServerId.IsMatch(serverId))
        {
            HttpContext.Response.StatusCode = 400;
            return;
        }

        if (HttpContext.WebSockets.IsWebSocketRequest)
        {
            using var webSocket = await HttpContext.WebSockets.AcceptWebSocketAsync();
            await HandleWebSocketConnection(webSocket, serverId);
        }
        else
        {
            HttpContext.Response.StatusCode = 400;
        }
    }

    private async Task HandleWebSocketConnection(WebSocket webSocket, string serverId)
    {
        var options = new PtyOptions
        {
            App = "powershell.exe",
            CommandLine = new string[0],
            Cols = 120,
            Rows = 30,
            Cwd = Environment.CurrentDirectory,
            Environment = new Dictionary<string, string>()
        };

        if (!serverId.Equals("localhost", StringComparison.OrdinalIgnoreCase) && 
            !serverId.Equals("127.0.0.1") && 
            !serverId.Equals("::1") && 
            !serverId.Equals(Environment.MachineName, StringComparison.OrdinalIgnoreCase))
        {
            options.CommandLine = new[] { "-NoExit", "-Command", $"Enter-PSSession -ComputerName '{serverId}'" };
        }

        using var pty = await PtyProvider.SpawnAsync(options, default);
        
        var cts = new CancellationTokenSource();
        var buffer = new byte[4096];

        // Task to read from PTY and write to WebSocket
        var readFromPtyTask = Task.Run(async () =>
        {
            try
            {
                while (!cts.IsCancellationRequested && webSocket.State == WebSocketState.Open)
                {
                    int read = await pty.ReaderStream.ReadAsync(buffer, 0, buffer.Length, cts.Token);
                    if (read > 0)
                    {
                        var segment = new ArraySegment<byte>(buffer, 0, read);
                        await webSocket.SendAsync(segment, WebSocketMessageType.Binary, true, cts.Token);
                    }
                    else
                    {
                        break; // EOF
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"PTY read error: {ex.Message}");
            }
            cts.Cancel();
        });

        // Loop to read from WebSocket and write to PTY
        var webSocketBuffer = new byte[4096];
        try
        {
            while (!cts.IsCancellationRequested && webSocket.State == WebSocketState.Open)
            {
                var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(webSocketBuffer), cts.Token);
                
                if (result.MessageType == WebSocketMessageType.Close)
                {
                    await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Client closed", CancellationToken.None);
                    break;
                }
                
                if (result.Count > 0)
                {
                    await pty.WriterStream.WriteAsync(webSocketBuffer, 0, result.Count, cts.Token);
                    await pty.WriterStream.FlushAsync();
                }
            }
        }
        catch (OperationCanceledException)
        {
            // Normal exit
        }
        catch (Exception ex)
        {
            Console.WriteLine($"WebSocket read error: {ex.Message}");
        }

        cts.Cancel();
        try { await readFromPtyTask; } catch {}
    }
}
