using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authorization;
using System.Text;
using Nexus.Gateway.Data;
using Microsoft.EntityFrameworkCore;
using Nexus.Gateway.BackgroundServices;
using Nexus.Gateway.Services;
using Nexus.Gateway.Hubs;
using Nexus.ControlPlane.Credentials;
using Nexus.ControlPlane.Data;
using Nexus.ControlPlane.Controllers;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseWindowsService(options =>
{
    options.ServiceName = "Nexus Backend";
});

builder.Logging.AddProvider(new MemoryLoggerProvider(MemoryLogSink.Instance));

// Add services to the container.
builder.Services.AddControllers().AddApplicationPart(typeof(CredentialsController).Assembly);
builder.Services.AddEndpointsApiExplorer();

// Authentication & Authorization
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtKey = builder.Configuration["Jwt:Key"] ?? Environment.GetEnvironmentVariable("JWT_KEY");
        if (string.IsNullOrEmpty(jwtKey) || jwtKey.Length < 32)
        {
            throw new InvalidOperationException("JWT_KEY must be configured with at least 32 characters in production.");
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
    options.AddPolicy("CredentialAdministrators", policy =>
        policy.RequireRole("Administrators", "Domain Admins"));
});

// Custom services
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? @"Server=(localdb)\MSSQLLocalDB;Database=nexus;Trusted_Connection=True;";
builder.Services.AddDbContext<NexusContext>(options => options.UseSqlServer(connectionString));
builder.Services.AddDbContext<NexusLogContext>(options => options.UseSqlServer(connectionString));
var controlPlaneDirectory = Path.Combine(builder.Environment.ContentRootPath, "App_Data");
Directory.CreateDirectory(controlPlaneDirectory);
var controlPlaneConnection = builder.Configuration.GetConnectionString("ControlPlane")
    ?? $"Data Source={Path.Combine(controlPlaneDirectory, "nexus-control-plane.db")};Cache=Shared";
builder.Services.AddDbContext<ControlPlaneDbContext>(options => options.UseSqlite(controlPlaneConnection));
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<ICredentialProtector, DpapiCredentialProtector>();
builder.Services.AddScoped<ICredentialVault, CredentialVault>();
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
        var allowedOrigins = Environment.GetEnvironmentVariable("ALLOWED_ORIGINS")?.Split(',') ?? new[] { "http://localhost:5173", "https://localhost:5173" };
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // Required for SignalR WebSocket transport
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

using (var scope = app.Services.CreateScope())
{
    var logDb = scope.ServiceProvider.GetRequiredService<NexusLogContext>();
    logDb.Database.EnsureCreated();
    
    var db = scope.ServiceProvider.GetRequiredService<NexusContext>();
    db.Database.Migrate();

    var controlPlaneDb = scope.ServiceProvider.GetRequiredService<ControlPlaneDbContext>();
    controlPlaneDb.Database.Migrate();

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
app.MapControllers();
app.MapHub<NotificationHub>("/hub/notifications");

app.MapGet("/api/health", () => Results.Ok(new { status = "Healthy" })).AllowAnonymous();

app.MapReverseProxy();

app.Run();
