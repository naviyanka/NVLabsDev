using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authorization;
using System.Text;
using Nexus.Gateway.Data;
using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.BackgroundServices;
using Nexus.Gateway.Services;
using Nexus.Gateway.Hubs;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseWindowsService(options =>
{
    options.ServiceName = "Nexus Backend";
});

builder.Logging.AddProvider(new MemoryLoggerProvider(MemoryLogSink.Instance));

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Authentication & Authorization
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "Nexus",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "NexusUsers",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "nexus-super-secret-key-1234567890-very-secure"))
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && (path.StartsWithSegments("/api/terminal") || path.StartsWithSegments("/hub/notifications")))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

// Custom services
builder.Services.AddDbContext<NexusContext>(options => options.UseSqlite("Data Source=nexus.db"));
builder.Services.AddDbContext<NexusLogContext>(options => options.UseSqlite("Data Source=nexus_logs.db"));
builder.Services.AddTransient<ActiveDirectoryService>();
builder.Services.AddSingleton<CimService>();
builder.Services.AddSingleton<PowerShellSessionManager>();
builder.Services.AddSingleton<PluginBackgroundJobManager>();
builder.Services.AddTransient<ServerService>();
builder.Services.AddTransient<NotificationService>();
builder.Services.AddTransient<IPowerShellExecutionService, PowerShellExecutionService>();
builder.Services.AddHostedService<TelemetryBackgroundService>();
builder.Services.AddHostedService<LogPersistenceService>();
builder.Services.AddHostedService<AdSyncBackgroundService>();
builder.Services.AddSignalR();

// Load port dynamically from database's WebBindingPort setting at startup
int webBindingPort = 5011;
try
{
    var optionsBuilder = new DbContextOptionsBuilder<NexusContext>();
    optionsBuilder.UseSqlite("Data Source=nexus.db");
    using var context = new NexusContext(optionsBuilder.Options);
    var setting = context.AppSettings.FirstOrDefault(s => s.Id == "global");
    if (setting != null && setting.WebBindingPort > 0)
    {
        webBindingPort = setting.WebBindingPort;
    }
}
catch
{
    // Fallback if database is not initialized/migrated yet
}

// Configure YARP for unified port proxying to Node.js frontend
builder.Services.AddReverseProxy()
    .LoadFromMemory(
        new[]
        {
            new Yarp.ReverseProxy.Configuration.RouteConfig
            {
                RouteId = "frontend_route",
                ClusterId = "frontend_cluster",
                Match = new Yarp.ReverseProxy.Configuration.RouteMatch { Path = "{**catch-all}" }
            }
        },
        new[]
        {
            new Yarp.ReverseProxy.Configuration.ClusterConfig
            {
                ClusterId = "frontend_cluster",
                Destinations = new Dictionary<string, Yarp.ReverseProxy.Configuration.DestinationConfig>(StringComparer.OrdinalIgnoreCase)
                {
                    { "frontend", new Yarp.ReverseProxy.Configuration.DestinationConfig { Address = $"http://127.0.0.1:{webBindingPort}" } }
                }
            }
        }
    );

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
            {
                // Allow localhost origins only (for dev + reverse proxy scenarios)
                var uri = new Uri(origin);
                return uri.Host == "localhost" || uri.Host == "127.0.0.1"
                    || uri.Host.Equals("::1", StringComparison.OrdinalIgnoreCase);
            })
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var logDb = scope.ServiceProvider.GetRequiredService<NexusLogContext>();
    logDb.Database.EnsureCreated();
    
    var db = scope.ServiceProvider.GetRequiredService<NexusContext>();
    db.Database.Migrate();

    var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    var setting = db.AppSettings.FirstOrDefault(s => s.Id == "global");
    if (setting != null)
    {
        var appPort = configuration.GetValue<int?>("Nexus:WebBindingPort");
        var appDomain = configuration.GetValue<string>("Nexus:DefaultDomainName");
        if (appPort.HasValue && appPort.Value > 0)
        {
            setting.WebBindingPort = appPort.Value;
        }
        if (!string.IsNullOrEmpty(appDomain))
        {
            setting.DefaultDomainName = appDomain;
        }
        db.SaveChanges();
    }
}

app.UseCors("AllowAll");
app.UseWebSockets();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<NotificationHub>("/hub/notifications");

app.MapReverseProxy();

app.Run();
