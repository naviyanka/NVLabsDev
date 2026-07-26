using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;

namespace Nexus.Gateway.Services;

public class LogEntryData
{
    public DateTime Timestamp { get; set; }
    public string LogLevel { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public class MemoryLogSink
{
    public static readonly MemoryLogSink Instance = new();
    private readonly ConcurrentQueue<LogEntryData> _pendingLogs = new();
    private const int MaxQueue = 5000;

    public void Log(string logLevel, string category, string message)
    {
        if (message.Contains("LogEntries") || message.Contains("LogSettings")) return;

        _pendingLogs.Enqueue(new LogEntryData
        {
            Timestamp = DateTime.UtcNow,
            LogLevel = logLevel,
            Category = category,
            Message = message
        });
        while (_pendingLogs.Count > MaxQueue && _pendingLogs.TryDequeue(out _)) { }
    }

    public List<LogEntryData> DequeuePending()
    {
        var list = new List<LogEntryData>();
        while (_pendingLogs.TryDequeue(out var item))
        {
            list.Add(item);
        }
        return list;
    }
}

public class MemoryLoggerProvider : ILoggerProvider
{
    private readonly MemoryLogSink _sink;
    public MemoryLoggerProvider(MemoryLogSink sink) => _sink = sink;
    public ILogger CreateLogger(string categoryName) => new MemoryLogger(_sink, categoryName);
    public void Dispose() { }
}

public class MemoryLogger : ILogger
{
    private readonly MemoryLogSink _sink;
    private readonly string _category;
    public MemoryLogger(MemoryLogSink sink, string category)
    {
        _sink = sink;
        _category = category;
    }
    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
    public bool IsEnabled(LogLevel logLevel) => true;
    public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
    {
        if (!IsEnabled(logLevel)) return;
        var msg = formatter(state, exception);
        if (exception != null) msg += $"\n{exception}";
        _sink.Log(logLevel.ToString(), _category, msg);
    }
}
