# Handoff Report: WACV2 Architectural & Framework Scan

## 1. Observation
Below are the exact code structures, file paths, line numbers, and decompiled source code patterns observed during the scan under `C:\navishare\DCFiles\WACV2`.

### A. Sub-Process Isolation and Microservices Orchestration
*   **File Path:** `C:\navishare\DCFiles\WACV2\Service\Microsoft.WindowsAdminCenter.Core\Core\ServiceProcessManager.cs`
*   **Observations:**
    *   WAC uses `Process.Start` to launch child processes representing sub-services (like WinRm, Cim, PowerShell).
    *   `ServiceProcessManager.cs` lines 349-375:
        ```csharp
        private void StartProcess(string name, int counter)
        {
          Process process = Process.Start(new ProcessStartInfo(Path.Join(this.currentFolder, PlatformRuntimeInformation.ExecutableName))
          {
            WorkingDirectory = this.currentFolder,
            UseShellExecute = false,
            CreateNoWindow = this.serviceMode,
            Arguments = "-service:" + name,
            Environment = {
              {
                "WindowsAdminCenterCoreEndpoint",
                this.coreEndpoint
              },
              ...
              {
                "WindowsAdminCenterService",
                name
              }
            }
          });
        ```
    *   `ServiceProcessManager.cs` lines 321-347: Exited event handler (`ProcessExited`) detects crashes and attempts to restart the process up to 5 times (`MaxRetry`), failing fast and shutting down the gateway (`ShutdownAll`) if exceeded.

### B. Dynamic Feature Extensibility Model
*   **File Path:** `C:\navishare\DCFiles\WACV2\Service\Microsoft.WindowsAdminCenter.Service\ServiceConfiguration\ControllerConfigurationExtensions.cs`
*   **Observations:**
    *   `AddDynamicControllers` extension method loads assemblies based on features configured in `WindowsAdminCenterConfiguration.FeatureConfigurationList`.
    *   `ControllerConfigurationExtensions.cs` lines 79-98:
        ```csharp
        defaultContext.Resolving += (Func<AssemblyLoadContext, AssemblyName, Assembly>) ((context, name) =>
        {
          foreach (string path1_1 in loadSet)
          {
            string str2 = Path.Join(path1_1, name.Name + ".dll");
            if (File.Exists(str2) && ControllerConfigurationExtensions.ValidateAssemblySignature(signatureValidator, gatewayHostInformation.IsDevelopmentMode, str2))
              return defaultContext.LoadFromAssemblyPath(str2);
          }
          return (Assembly) null;
        });
        foreach (string str3 in stringList)
        {
          if (ControllerConfigurationExtensions.ValidateAssemblySignature(signatureValidator, gatewayHostInformation.IsDevelopmentMode, str3))
          {
            Assembly assembly = defaultContext.LoadFromAssemblyPath(str3);
            mvcBuilder.AddApplicationPart(assembly);
            bool flag = ControllerConfigurationExtensions.controllerConfiguration.TryAddStartup(assembly);
            ...
          }
        }
        ```
    *   Extensibility Contract interface `IFeatureControllerStartup` in `C:\navishare\DCFiles\WACV2\Service\Microsoft.WindowsAdminCenter.FeatureExternal\IFeatureControllerStartup.cs`:
        ```csharp
        public interface IFeatureControllerStartup
        {
          ApplicationConfigurationOrderingPreference ApplicationConfigurationOrderingPreference { get => ApplicationConfigurationOrderingPreference.None; }
          void PartiallyConfigureServices(IConfiguration configuration, IServiceCollection services) {}
          void PartiallyConfigureApplication(IConfiguration configuration, IApplicationBuilder app) { throw new NotImplementedException(...); }
        }
        ```
    *   Concrete implementations in controller DLLs (e.g. `CimStartup` in `Controllers\Microsoft.WindowsAdminCenter.Controllers.Cim\CimStartup.cs` line 18):
        ```csharp
        public class CimStartup : IFeatureControllerStartup
        {
          public void PartiallyConfigureServices(IConfiguration configuration, IServiceCollection services)
          {
            services.TryAddSingleton<ICimProxy, CimProxy>();
            ...
          }
        }
        ```

### C. Request Authentication and Context Management
*   **File Path:** `C:\navishare\DCFiles\WACV2\Service\Microsoft.WindowsAdminCenter.Service\Middleware\ContextMiddleware.cs`
*   **Observations:**
    *   WAC communicates credentials and active Windows Token Handles across processes using custom HTTP headers.
    *   `ContextMiddleware.cs` lines 162-193:
        *   Non-Windows platform authentication: Decrypts base64 encoded user credentials using a shared secret and builds the platform identity.
        *   Windows platform authentication: Parses a Hex-based token handle from the header (`wac-service-token`) into an `IntPtr` to initialize the impersonated context:
            ```csharp
            IntPtr result = IntPtr.Zero;
            if (!string.IsNullOrEmpty(tokenHeaderValue))
              IntPtr.TryParse(tokenHeaderValue, NumberStyles.HexNumber, (IFormatProvider) CultureInfo.InvariantCulture, out result);
            IPlatformIdentity platformIdentity = this.platformService.IdentityBuilder.Build(result);
            windowsDisposable = OperationContext.CreateContext(httpContext, this.platformService, platformIdentity, this.requestManager);
            ```

### D. Reverse Proxy and Multipart Request Batching
*   **File Path:** `C:\navishare\DCFiles\WACV2\Service\Microsoft.WindowsAdminCenter.ScopedProxy\ProxyMiddleware.cs`
*   **Observations:**
    *   `ProxyMiddleware` acts as a reverse proxy routing client requests to the individual loopback services.
    *   It supports request grouping under `/api/batch`. It reads multipart requests containing individual HTTP requests, forwards them in parallel using `Task.WhenAll`, aggregates their responses, and packages them back into a single multipart HTTP response:
        ```csharp
        private async Task ProcessBatchRequest(HttpContext context)
        {
          IList<HttpRequestMessage> httpRequestMessageList = await new BatchRequestContext(context).CreateHttpRequestMessages().ConfigureAwait(false);
          ...
          HttpResponseMessage[] httpResponseMessageArray = await Task.WhenAll<HttpResponseMessage>((IEnumerable<Task<HttpResponseMessage>>) responseTasks);
          for (int index = 0; index < httpResponseMessageArray.Length; ++index)
          {
            ProxyHttpResponseMessageContent content = new ProxyHttpResponseMessageContent(httpResponseMessageArray[index]);
            ...
            multipartContent.Add((HttpContent) content);
          }
          await context.ProxyRespondMultipartContent(multipartContent);
        }
        ```

---

## 2. Logic Chain
1. **Dynamic Extensibility:** Because WAC consists of many tools (Active Directory, CIM, PowerShell, etc.), loading all tools into memory directly or hardcoding their endpoints would violate separation of concerns and limit dynamic updates. The presence of `AddDynamicControllers` (Observation B) shows WAC uses ASP.NET Core `Application Parts` to dynamically scan feature DLL assemblies listed in configuration.
2. **Feature Startup Injection:** To allow each dynamically loaded controller to configure its own services and middleware without modifying the main entry point, WAC uses the `IFeatureControllerStartup` interface (Observation B). Each controller DLL implements this interface, allowing `ControllerConfiguration` to execute their respective `PartiallyConfigureServices` and `PartiallyConfigureApplication` logic at startup.
3. **Process Isolation:** If all dynamically loaded features ran inside a single process, a single memory leak, crash, or hung operation in one tool (e.g. WinRM or PowerShell cmdlet execution) would crash the entire gateway. `ServiceProcessManager.cs` (Observation A) proves WAC addresses this by running each distinct sub-service as a separate process executing the same service executable with arguments (e.g., `-service:Cim`).
4. **Secure Loopback Communication:** Because sub-services run as separate loopback processes, they must verify that incoming requests originate from the authorized main gateway process and represent authenticated web users. `ContextMiddleware.cs` (Observation C) shows that the gateway encrypts credentials or passes active Windows token handles in HTTP headers. The subservice decrypts or translates these handles via `IntPtr` and executes the REST requests under the impersonated context of the caller.
5. **Parallel Request Optimization:** Web consoles query many different nodes and resource providers simultaneously, causing high latency if done sequentially over WAN. `ProxyMiddleware.cs` (Observation D) resolves this by accepting batch requests via `/api/batch`, proxying the individual sub-requests to sub-services in parallel using async task aggregation (`Task.WhenAll`), and returning a single multipart response.

---

## 3. Caveats
- **Interprocess Communication (IPC):** The details of the underlying channel used by `PrivilegedAccountChannel` and `WacTaskService` were not deeply scanned.
- **Frontend-Backend Contract:** This report focuses strictly on the decompiled ASP.NET Core backend assemblies under `WACV2`. The corresponding Angular frontend application layout was not analyzed.

---

## 4. Conclusion
Windows Admin Center V2 uses a **Process-Isolated Microservices Architecture** running locally. The main gateway process orchestrates sub-service processes, routes requests via a reverse proxy (`ProxyMiddleware`), and handles request aggregation via parallel batching. Dynamic features are dynamically loaded as ASP.NET Core Application Parts using the `IFeatureControllerStartup` extensibility model. Security across sub-processes is maintained by forwarding Windows token handles or encrypted credentials over loopback interfaces, verified via SHA-256 request timestamp hashing and a shared secret.

---

## 5. Verification Method
To verify these architectural findings in the WACV2 source base, check the following key code pathways:
1. **Process Orchestration:** Open `C:\navishare\DCFiles\WACV2\Service\Microsoft.WindowsAdminCenter.Core\Core\ServiceProcessManager.cs` and verify how `StartProcess` configures arguments (`-service:`) and environment variables (`WindowsAdminCenterService`, `WindowsAdminCenterSecret`).
2. **Plugin Loading:** Inspect `C:\navishare\DCFiles\WACV2\Service\Microsoft.WindowsAdminCenter.Service\ServiceConfiguration\ControllerConfigurationExtensions.cs` to verify how `AddDynamicControllers` validates assembly signatures and registers application parts.
3. **Context impersonation:** Inspect `C:\navishare\DCFiles\WACV2\Service\Microsoft.WindowsAdminCenter.Service\Middleware\ContextMiddleware.cs` to check how `wac-service-token` is parsed as an `IntPtr` and utilized with `OperationContext.CreateContext`.
