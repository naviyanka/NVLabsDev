# Handoff Report — WACV2 API and Communications Scan

This report synthesizes findings from a comprehensive scan of the decompiled code in `C:\navishare\DCFiles\WACV2` to identify API structures, routing mechanisms, request/response handlers, controllers, endpoints, and communication protocols.

---

## 1. Observation

Direct code observations from files under `C:\navishare\DCFiles\WACV2`:

### A. API Controllers & Routing Definitions
Exactly 14 controllers are defined. They inherit from `ControllerBase` and use ASP.NET Core routing and HTTP attributes (`[ApiController]`, `[Route("api/[controller]")]`):
* **Path**: `C:\navishare\DCFiles\WACV2\Controllers\Microsoft.WindowsAdminCenter.Controllers.ActiveDirectory\ActiveDirectoryController.cs`
  * Endpoints:
    * `GET api/ActiveDirectory/accounts` (Retrieves nodes matching filter via LDAP querying)
    * `GET api/ActiveDirectory/domain` (Gets local domain information)
* **Path**: `C:\navishare\DCFiles\WACV2\Controllers\Microsoft.WindowsAdminCenter.Controllers.Cim\CimController.cs`
  * Endpoints:
    * `POST api/Cim/nodes/{node}/namespaces/{namespaceName}/query` (Executes WMI/CIM queries)
    * `PUT api/Cim/nodes/{node}/namespaces/{namespaceName}/classes/{className}/instances/{instanceKey}` (Creates class instances)
    * `PATCH api/Cim/nodes/{node}/namespaces/{namespaceName}/classes/{className}/instances/{instanceKey}` (Updates instance properties)
    * `POST api/Cim/nodes/{node}/namespaces/{namespaceName}/classes/{className}/instances/{instanceKey}/methods/{methodName}/invoke` (Invokes WMI methods)
    * `DELETE api/Cim/nodes/{node}/namespaces/{namespaceName}/classes/{className}/instances/{instanceKey}` (Deletes WMI instances)
    * `GET api/Cim/nodes/{node}/namespaces` & `GET api/Cim/nodes/{node}/namespaces/{namespaceName}` (Retrieves namespaces)
* **Path**: `C:\navishare\DCFiles\WACV2\Controllers\Microsoft.WindowsAdminCenter.Controllers.DeploymentShare\DeploymentShareController.cs`
  * Endpoints:
    * `GET api/DeploymentShare/{shareType}` (Lists shares)
    * `PUT api/DeploymentShare/{shareType}/{networkShareName}` (Creates a network share)
    * `DELETE api/DeploymentShare/{shareType}/{networkShareName}` (Deletes a share)
    * `POST api/DeploymentShare/{shareType}/{shareName}/download` (Downloads files asynchronously, returning `202 Accepted` with a `Location` header)
    * `GET api/DeploymentShare/{shareType}/{shareName}/download/{downloadId}` (Polls status)
* **Path**: `C:\navishare\DCFiles\WACV2\Controllers\Microsoft.WindowsAdminCenter.Controllers.FileTransfer\FileTransferController.cs`
  * Endpoints:
    * `GET api/FileTransfer/nodes/{node}/files/{*filePath}` (Downloads file content directly)
    * `PUT api/FileTransfer/nodes/{node}/files/{*filePath}` (Direct file upload)
    * `POST api/FileTransfer/nodes/{node}/files/{*filePath}` (Initiates/configures chunked/resumable file upload)
    * `PATCH api/FileTransfer/nodes/{node}/files/{*filePath}` (Uploads individual chunks matching `Content-Range`)
    * `DELETE api/FileTransfer/nodes/{node}/files/{*filePath}` (Cancels active upload)
* **Path**: `C:\navishare\DCFiles\WACV2\Controllers\Microsoft.WindowsAdminCenter.Controllers.Jea\JeaController.cs`
  * Endpoints:
    * `PUT api/Jea/nodes/{node}/endpoint` (Configures JEA via DSC configuration)
    * `DELETE api/Jea/nodes/{node}/endpoint` (Uninstalls JEA)
    * `POST api/Jea/endpoint/export` (Exports DSC setup as ZIP archive)
* **Path**: `C:\navishare\DCFiles\WACV2\Controllers\Microsoft.WindowsAdminCenter.Controllers.Nuget\NugetController.cs`
  * Endpoints:
    * `POST api/Nuget/nodes/{node}/packages/{packageId}/versions/{version}/install` (Installs NuGet extension packages)
* **Path**: `C:\navishare\DCFiles\WACV2\Controllers\Microsoft.WindowsAdminCenter.Controllers.PerformanceCounter\PerformanceCounterController.cs`
  * Endpoints:
    * `GET api/PerformanceCounter/nodes/{node}/categories` (Gets categories)
    * `POST api/PerformanceCounter/nodes/{node}/query` (Queries counter samples, returned as raw binary streams)
* **Path**: `C:\navishare\DCFiles\WACV2\Controllers\Microsoft.WindowsAdminCenter.Controllers.PowerShell\PowerShell\PowerShellController.cs`
  * Endpoints:
    * `GET api/PowerShell/nodes/{node}/pssessions` (Lists active sessions)
    * `PUT api/PowerShell/nodes/{node}/pssessions/{sessionName?}` (Creates standard PowerShell session)
    * `POST api/PowerShell/nodes/{node}/pssessions/{sessionId}/invokeCommand` (Invokes a cmdlet within a session)
    * `POST api/PowerShell/nodes/{node}/invokeCommand` (One-off ad-hoc cmdlet execution)
* **Path**: `C:\navishare\DCFiles\WACV2\Controllers\Microsoft.WindowsAdminCenter.Controllers.PowerShell\Wdac\WdacController.cs`
  * Endpoints:
    * `GET api/Wdac/nodes/{node}/operations/psLanguageMode` (Gets PowerShell language mode)
    * `POST api/Wdac/nodes/{node}/operations/resetWdacCache` (Resets WDAC caches)
* **Path**: `C:\navishare\DCFiles\WACV2\Controllers\Microsoft.WindowsAdminCenter.Controllers.State\StateController.cs`
  * Endpoints:
    * `GET/PUT/DELETE api/State/nodes/{node}/extensions/{extensionId}/settings[/{settingName}]` (Saves/retrieves settings from target node's CurrentUser registry hive)

### B. WebSockets
Three endpoints explicitly upgrade connections to WebSockets:
1. **Pty Console Shell**: `api/PseudoConsole/nodes/{node}/powershellconsole`
   * **Path**: `C:\navishare\DCFiles\WACV2\Controllers\Microsoft.WindowsAdminCenter.Controllers.PseudoConsole\PseudoConsoleController.cs`
   * Code:
     ```csharp
     if (!consoleController.HttpContext.WebSockets.IsWebSocketRequest)
       return (IActionResult) consoleController.BadRequest();
     ...
     using (WebSocket webSocket = await consoleController.HttpContext.WebSockets.AcceptWebSocketAsync().ConfigureAwait(true))
     {
       using (PtyStreamHandler ptyStreamHandler = new PtyStreamHandler(...))
       {
         await new WebSocketToPowerShellConsoleProxy(webSocket, ..., (IPtyStreamHandler) ptyStreamHandler, ...).HandleAsync().ConfigureAwait(true);
     ```
2. **Binary TCP Tunneling**: `api/Tcp/nodes/{node}/ports/{port}`
   * **Path**: `C:\navishare\DCFiles\WACV2\Controllers\Microsoft.WindowsAdminCenter.Controllers.Tcp\TcpController.cs`
   * Code:
     ```csharp
     if (!tcpController.HttpContext.WebSockets.IsWebSocketRequest)
       return (IActionResult) tcpController.BadRequest();
     string subProtocol = tcpController.HttpContext.WebSockets.WebSocketRequestedProtocols.FirstOrDefault<string>();
     if (subProtocol != "binary")
       throw new ApplicationException("Couldn't find expected sub protocol of WebSocket.");
     using (WebSocket webSocket = await tcpController.HttpContext.WebSockets.AcceptWebSocketAsync(subProtocol).ConfigureAwait(false))
     {
       using (WebSocketToTcpHandler webSocketToTcpHandler = new WebSocketToTcpHandler(webSocket, node, port))
       {
         await webSocketToTcpHandler.ProcessWebSocketRequestAsync().ConfigureAwait(false);
     ```
3. **Stream Multiplexing**: `api/Stream/socket/{module}`
   * **Path**: `C:\navishare\DCFiles\WACV2\Controllers\Microsoft.WindowsAdminCenter.Controllers.Stream\StreamController.cs`
   * Code:
     ```csharp
     if (!streamController.HttpContext.WebSockets.IsWebSocketRequest)
       return (IActionResult) streamController.BadRequest();
     using (WebSocket webSocket = await streamController.HttpContext.WebSockets.AcceptWebSocketAsync().ConfigureAwait(false))
     {
       using (WebSocketToStreamProxy webSocketStreamProxy = new WebSocketToStreamProxy(webSocket, ...))
       {
         await webSocketStreamProxy.ProcessWebSocketRequestAsync().ConfigureAwait(false);
     ```

### C. SignalR Notifications
* **Path**: `C:\navishare\DCFiles\WACV2\Service\Microsoft.WindowsAdminCenter.Core\Core\Startup.cs`
  * Code:
    ```csharp
    endpoints.MapHub<NotificationHub>("/api/notifications");
    ```

### D. gRPC over Named Pipes (IPC)
* **Client Path**: `C:\navishare\DCFiles\WACV2\Service\Microsoft.WindowsAdminCenter.WindowsCommon\WindowsCommon\Proto\PrivilegedAccountChannel.cs`
  * Code:
    ```csharp
    this.channel = new NamedPipeChannel(".", "microsoft.windows-admin-center.privileged-account2");
    this.client = new PrivilegedAccount.PrivilegedAccountClient((CallInvoker) this.channel);
    ```
* **Server Path**: `C:\navishare\DCFiles\WACV2\Service\WindowsAdminCenterAccountManagement\AccountManagement\AccountManager.cs`
  * Code:
    ```csharp
    PipeSecurity pipeSecurity = new PipeSecurity();
    pipeSecurity.AddAccessRule(new PipeAccessRule((IdentityReference) new SecurityIdentifier(WellKnownSidType.LocalSystemSid, (SecurityIdentifier) null), PipeAccessRights.ReadWrite, AccessControlType.Allow));
    pipeSecurity.AddAccessRule(new PipeAccessRule((IdentityReference) new SecurityIdentifier(WellKnownSidType.NetworkServiceSid, (SecurityIdentifier) null), PipeAccessRights.ReadWrite, AccessControlType.Allow));
    this.namedPipeServer = new NamedPipeServer("microsoft.windows-admin-center.privileged-account2", new NamedPipeServerOptions()
    {
      PipeSecurity = pipeSecurity
    });
    PrivilegedAccount.BindService(this.namedPipeServer.ServiceBinder, (PrivilegedAccount.PrivilegedAccountBase) this.privilegedAccountService);
    this.namedPipeServer.Start();
    ```

### E. Dynamic Controller Loading & Verification
* **Path**: `C:\navishare\DCFiles\WACV2\Service\Microsoft.WindowsAdminCenter.Service\ServiceConfiguration\ControllerConfigurationExtensions.cs`
  * Signature verification with deletion logic:
    ```csharp
    private static bool ValidateAssemblySignature(
      ISignatureValidator signatureValidator,
      bool isDevelopmentMode,
      string filePath)
    {
      if (isDevelopmentMode)
        return true;
      if (File.Exists(filePath) && !signatureValidator.ValidateSingleFile(filePath))
      {
        Logger.LogWarning(LogSource.ServicePlatform, $"Failed to validate the signature of {filePath}. Deleting file.");
        File.Delete(filePath);
        return false;
      }
      if (!Directory.Exists(filePath) || signatureValidator.Validate(filePath, false).IsValid)
        return true;
      Logger.LogWarning(LogSource.ServicePlatform, $"Failed to validate the signature of {filePath}. Deleting directory.");
      Directory.Delete(filePath, true);
      return false;
    }
    ```
  * App parts registration:
    ```csharp
    Assembly assembly = defaultContext.LoadFromAssemblyPath(str3);
    mvcBuilder.AddApplicationPart(assembly);
    ```

---

## 2. Logic Chain

1. **REST APIs**: Observations in `ActiveDirectoryController.cs`, `CimController.cs`, etc. show the application exposes REST APIs. These are hosted inside Kestrel (configured in `Startup.cs` of Core/Service) and routed using MVC attributes like `[Route("api/[controller]")]`.
2. **WebSockets**: The code checking `IsWebSocketRequest` and calling `AcceptWebSocketAsync()` in `PseudoConsoleController.cs`, `TcpController.cs`, and `StreamController.cs` confirms that interactive PowerShell consoles, TCP port tunnels, and stream proxies bypass REST, upgrading to long-lived WebSocket connections.
3. **SignalR**: Mapping `/api/notifications` to `NotificationHub` in `Startup.cs` indicates that background task notifications (like long-running downloads or DSC configurations) are pushed to the client using ASP.NET Core SignalR.
4. **gRPC IPC**: `PrivilegedAccountChannel.cs` and `AccountManager.cs` establish a `NamedPipeChannel` and a matching `NamedPipeServer` named `"microsoft.windows-admin-center.privileged-account2"` using the `GrpcDotNetNamedPipes` library. The `PipeSecurity` rules restrict access to the local `SYSTEM` and `NetworkService` accounts, demonstrating that elevated background actions (like virtual account creation) run in a separate helper service (`WindowsAdminCenterAccountManagement`) using gRPC-over-named-pipes as the IPC mechanism.
5. **Serialization/Data Handling**:
   * Standard endpoints use `System.Text.Json` (camelCase) to serialize DTOs.
   * `PerformanceCounterController.cs` uses `BinaryWriter` to write raw byte blocks directly to the response body for `Query` calls (returning `application/octet-stream`), avoiding JSON overhead.
   * `FileTransferController.cs` implements custom chunked upload state using a `.partial` data file and `.partial.progress` offset mapping file to track chunked uploads via HTTP `Content-Range`.

---

## 3. Caveats

* **Active Directory Search Configuration**: LDAP search criteria limits are hardcoded (`DirectorySeacherServerTimeLimit` = 30 seconds). Slow LDAP servers might trigger query timeouts.
* **Elevated IPC Access**: The gRPC Named Pipe server only allows `LocalSystem` and `Network Service`. If the Gateway process runs under another user profile (unless mapped in settings), IPC requests to manage accounts/certificates will fail.
* **Assembly Deletion Risk**: In production mode (`isDevelopmentMode = false`), if any feature assembly's signature check fails, the application deletes the assembly file/directory from disk.

---

## 4. Conclusion

Windows Admin Center (WACV2) implements a highly modular, multi-protocol communication topology. Web REST APIs serve CRUD actions and queries. WebSockets provide high-throughput channels for interactive terminals and generic TCP tunneling. SignalR delivers real-time notifications, while gRPC over Named Pipes securely offloads system-privileged execution tasks (such as managing local Windows virtual accounts and TLS certificate stores) to an isolated, elevated background service.

---

## 5. Verification Method

To independently verify these findings, inspect the decompiled files:
1. **WAC Controllers**: Verify endpoints and parameters by checking the class decorators and route declarations in files under `C:\navishare\DCFiles\WACV2\Controllers`.
2. **WebSocket Upgrades**: Confirm WebSockets are utilized by verifying the presence of `AcceptWebSocketAsync` inside `PseudoConsoleController.cs`, `TcpController.cs`, and `StreamController.cs`.
3. **IPC Named Pipe**: Confirm the gRPC named pipe by checking `"microsoft.windows-admin-center.privileged-account2"` in `PrivilegedAccountChannel.cs` and `AccountManager.cs`.
4. **Signature Deletion**: Inspect the signature validation logic in `ControllerConfigurationExtensions.cs` to verify that `File.Delete` is executed upon validation failure.
