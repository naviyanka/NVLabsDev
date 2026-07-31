using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authorization;
using System.Text;
using Nexus.Gateway.Data;
using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.BackgroundServices;
using Nexus.Gateway.Services;
using Nexus.Gateway.Hubs;
using Nexus.Gateway.Middleware;

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
        var jwtKey = builder.Configuration["Jwt:Key"];
        if (string.IsNullOrEmpty(jwtKey))
            jwtKey = Environment.GetEnvironmentVariable("JWT_KEY");
        if (string.IsNullOrEmpty(jwtKey) || jwtKey.Length < 32)
        {
            if (builder.Environment.IsDevelopment())
                jwtKey = "NexusDevOnlyFallbackKey_32chars!!";
            else
                throw new InvalidOperationException("JWT signing key must be configured via 'Jwt:Key' in appsettings.json, user-secrets, or the JWT_KEY environment variable. Key must be at least 32 characters.");
        }
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "Nexus",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "NexusUsers",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
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
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (!string.IsNullOrEmpty(connectionString))
{
    builder.Services.AddDbContext<NexusContext>(options => options.UseSqlServer(connectionString));
    builder.Services.AddDbContext<NexusLogContext>(options => options.UseSqlServer(connectionString));
}
else
{
    builder.Services.AddDbContext<NexusContext>(options => options.UseInMemoryDatabase("NexusDB"));
    builder.Services.AddDbContext<NexusLogContext>(options => options.UseInMemoryDatabase("NexusLogDB"));
}
builder.Services.AddTransient<ActiveDirectoryService>();
builder.Services.AddSingleton<CimService>();
builder.Services.AddSingleton<PowerShellSessionManager>();
builder.Services.AddSingleton<PluginBackgroundJobManager>();
builder.Services.AddTransient<ServerService>();
builder.Services.AddTransient<NotificationService>();
builder.Services.AddTransient<IPowerShellExecutionService, PowerShellExecutionService>();
builder.Services.AddTransient<PluginSandboxService>();
builder.Services.AddScoped<AuditLogService>();
builder.Services.AddHostedService<TelemetryBackgroundService>();
builder.Services.AddHostedService<LogPersistenceService>();
builder.Services.AddHostedService<AdSyncBackgroundService>();
builder.Services.AddHostedService<PerformanceStreamService>();
builder.Services.AddHostedService<AuditRetentionService>();
builder.Services.AddHostedService<RunbookSchedulerService>();
builder.Services.AddSignalR();
builder.Services.AddHttpClient();

// Environment variable overrides
var isDev = Environment.GetEnvironmentVariable("DEV") == "1";
var isProd = Environment.GetEnvironmentVariable("PROD") == "1";

// Load port dynamically from database's WebBindingPort setting at startup
int webBindingPort = 5011; // Default prod port

try
{
    var optionsBuilder = new DbContextOptionsBuilder<NexusContext>();
    optionsBuilder.UseSqlServer(connectionString);
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

// Apply env overrides (highest priority)
if (isDev)
{
    webBindingPort = 5173; // Vite dev server port
}
else if (isProd)
{
    webBindingPort = 5011; // Production port
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
    options.AddPolicy("AllowRestricted", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
        if (allowedOrigins != null && allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
        else
        {
            // Development/unconfigured: allow all origins (warning logged at startup)
            policy.SetIsOriginAllowed(_ => true)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
    });
});

// Support forwarded headers from tunnel proxies (ngrok, Cloudflare, Tailscale)
builder.Services.Configure<Microsoft.AspNetCore.Builder.ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor 
                             | Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

var app = builder.Build();

// Warn if CORS is running in unrestricted allow-all mode
{
    var corsOrigins = app.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
    if (corsOrigins == null || corsOrigins.Length == 0)
    {
        var startupLogger = app.Services.GetRequiredService<ILogger<Program>>();
        startupLogger.LogWarning("CORS is configured to allow ALL origins. Set 'Cors:AllowedOrigins' in appsettings.json to restrict access in production.");
    }
}

using (var scope = app.Services.CreateScope())
{
    try
    {
        var logDb = scope.ServiceProvider.GetRequiredService<NexusLogContext>();
        logDb.Database.EnsureCreated();
        
        var db = scope.ServiceProvider.GetRequiredService<NexusContext>();
        db.Database.EnsureCreated();

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
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogWarning(ex, "Database connection/migration bypassed at startup. Ensure SQL Server or LocalDB is configured for persistent DB storage.");
    }
}

if (app.Environment.IsProduction() || isProd)
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseForwardedHeaders();
app.UseCors("AllowRestricted");
app.UseWebSockets();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<AuditLoggingMiddleware>();
app.MapControllers();
app.MapHub<NotificationHub>("/hub/notifications");

app.MapReverseProxy();

app.Run();

