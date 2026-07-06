# Handoff Report - Scan of Decompiled DLL Folders in WACV2

## 1. Observation

A read-only scan of the directory `C:\navishare\DCFiles\WACV2` was executed. The following subdirectories and file structures were directly observed:

### Directory Listing of `C:\navishare\DCFiles\WACV2`
Calling `list_dir` on `C:\navishare\DCFiles\WACV2` returned 13 subdirectories:
- `Controllers`
- `PresentationFramework`
- `Service`
- `System.Management.Automation`
- `System.Private.ServiceModel`
- `System.Private.Xml`
- `System.Security.Cryptography`
- `System.Speech`
- `System.Transactions.Local`
- `System.Windows.Forms`
- `System.Windows.Forms.Design`
- `System.Windows.Forms.Primitives`
- `System.Xaml`

### Detailed Analysis of Decompiled Folders

#### A. `C:\navishare\DCFiles\WACV2\System.Speech`
- **File & Folder Structure**: Contains 7 subdirectories (`AudioFormat`, `ILLink`, `Internal`, `Recognition`, `Synthesis`, `System`, `lib`) and 15 files:
  - `System.Speech.csproj` (26,646 bytes)
  - `System.Speech.sln` (912 bytes)
  - `System.Speech.pdb` (219,832 bytes)
  - `AssemblyInfo.cs`, `Interop.cs`, `SR.cs`, `SRID.cs`
  - `ExceptionStringTable.resx` (63,678 bytes)
  - 6 localization map files (`.upsmap`): `upstable_chs.upsmap` (118,766 bytes), `upstable_cht.upsmap` (8,980 bytes), `upstable_deu.upsmap` (4,512 bytes), `upstable_enu.upsmap` (3,244 bytes), `upstable_esp.upsmap` (4,782 bytes), `upstable_fra.upsmap` (3,874 bytes), `upstable_jpn.upsmap` (11,214 bytes).
- **Metadata (from `.csproj`)**:
  - Export comment: `<!--Project was exported from assembly: C:\navishare\DCFiles\WAC\WindowsAdminCenter\Service\System.Speech.dll-->`
  - `<OutputType>`: `Library`
  - `<TargetFrameworkVersion>`: `v8.0` (.NET 8.0)
  - `<RootNamespace>`: `System.Speech`
- **Inferred Purpose**: Provides the standard implementation for speech recognition and speech synthesis (text-to-speech) capabilities in Windows Admin Center under .NET 8.0.

#### B. `C:\navishare\DCFiles\WACV2\System.Transactions.Local`
- **File & Folder Structure**: Contains 4 subdirectories (`FxResources`, `ILLink`, `System`, `lib`) and 58 files. 
  - `System.Transactions.Local.csproj` (23,649 bytes), `System.Transactions.Local.sln`, `System.Transactions.Local.pdb`.
  - Numerous C# files representing DTC proxy shims and interfaces with compiler-generated names, such as: `1_003CSystem_Transactions_DtcProxyShim_DtcInterface.cs`, `_003CSystem_Transactions_DtcProxyShim_EnlistmentNo.cs`.
- **Metadata (from `.csproj`)**:
  - Export comment: `<!--Project was exported from assembly: System.Transactions.Local.dll inside C:\navishare\DCFiles\WAC\WindowsAdminCenter\Service\efbundle.exe)-->`
  - `<OutputType>`: `Library`
  - `<TargetFrameworkVersion>`: `v8.0` (.NET 8.0)
- **Inferred Purpose**: Implements local and distributed transaction (MSDTC) operations for the system. Crucially, this assembly was packaged inside `efbundle.exe` (Entity Framework Bundle).

#### C. `C:\navishare\DCFiles\WACV2\System.Xaml`
- **File & Folder Structure**: Contains 4 subdirectories (`FxResources`, `MS`, `System`, `lib`) and 4 files:
  - `System.Xaml.csproj` (20,229 bytes), `System.Xaml.sln`, `System.Xaml.pdb`, `AssemblyInfo.cs`.
- **Metadata (from `.csproj`)**:
  - Export comment: `<!--Project was exported from assembly: C:\navishare\DCFiles\WAC\WindowsAdminCenter\Service\System.Xaml.dll-->`
  - `<OutputType>`: `Library`
  - `<TargetFrameworkVersion>`: `v8.0` (.NET 8.0)
- **Inferred Purpose**: Implements standard XAML readers, writers, and schemas for processing Extensible Application Markup Language.

#### D. `C:\navishare\DCFiles\WACV2\Controllers\Microsoft.WindowsAdminCenter.Controllers.ActiveDirectory`
- **File & Folder Structure**: Contains 3 subdirectories (`.vs`, `bin`, `obj`) and 10 files:
  - `Microsoft.WindowsAdminCenter.Controllers.ActiveDirectory.csproj` (3,136 bytes), `Microsoft.WindowsAdminCenter.Controllers.ActiveDirectory.sln`, `Microsoft.WindowsAdminCenter.Controllers.ActiveDirectory.pdb`.
  - C# source files: `ActiveDirectoryController.cs` (5,762 bytes), `ActiveDirectoryService.cs` (3,824 bytes), `ActiveDirectoryStartup.cs` (946 bytes), `AccountInfo.cs`, `ActiveDirectoryAccountType.cs`, `IActiveDirectoryService.cs`, `AssemblyInfo.cs`.
- **Metadata (from `.csproj`)**:
  - Export comment: `<!--Project was exported from assembly: C:\navishare\DCFiles\WAC\WindowsAdminCenter\Controllers\Microsoft.WindowsAdminCenter.Controllers.ActiveDirectory.dll-->`
  - `<OutputType>`: `Library`
  - `<TargetFrameworkVersion>`: `v4.8` (.NET Framework 4.8)
  - `<RootNamespace>`: `Microsoft.WindowsAdminCenter.Controllers.ActiveDirectory`
- **Inferred Purpose**: A custom ASP.NET MVC/Web API controller library providing endpoints and Active Directory queries (using `System.DirectoryServices`) for Windows Admin Center interface features.

#### E. `C:\navishare\DCFiles\WACV2\Service\WindowsAdminCenter`
- **File & Folder Structure**: Contains 2 subdirectories (`WindowsAdminCenter`, `lib`) and 7 files:
  - `WindowsAdminCenter.csproj` (3,198 bytes), `WindowsAdminCenter.sln`, `WindowsAdminCenter.pdb`.
  - C# source files: `WindowsService.cs` (3,416 bytes), `ServiceApplication.cs` (1,245 bytes), `Application.cs` (966 bytes), `AssemblyInfo.cs`.
- **Metadata (from `.csproj`)**:
  - Export comment: `<!--Project was exported from assembly: C:\navishare\DCFiles\WAC\WindowsAdminCenter\Service\WindowsAdminCenter.dll-->`
  - `<OutputType>`: `Library`
  - `<TargetFrameworkVersion>`: `v8.0` (.NET 8.0)
  - `<RootNamespace>`: `Microsoft.WindowsAdminCenter.Executable`
- **Inferred Purpose**: Serves as the main Windows Service application host entry point for running Windows Admin Center under .NET 8.0.

#### F. `C:\navishare\DCFiles\WACV2\System.Management.Automation`
- **File & Folder Structure**: Contains 3 subdirectories (`Microsoft`, `System`, `lib`) and 79 files:
  - `System.Management.Automation.csproj` (199,497 bytes), `System.Management.Automation.sln`, `System.Management.Automation.pdb`.
  - Numerous C# files containing resource strings and exception messages: `CmdletizationCoreResources.cs`, `AutomationExceptions.cs`, `FileSystemProviderStrings.cs`, `ParserStrings.cs`, etc.
- **Metadata (from `.csproj`)**:
  - Export comment: `<!--Project was exported from assembly: C:\navishare\DCFiles\WAC\WindowsAdminCenter\Service\System.Management.Automation.dll-->`
  - `<OutputType>`: `Library`
  - `<TargetFrameworkVersion>`: `v8.0` (.NET 8.0)
  - `<ApplicationVersion>`: `7.4.6.500`
- **Inferred Purpose**: Core engine assembly for PowerShell 7.4.6, powering cmdlet execution, pipelines, runspaces, and PowerShell scripts inside Windows Admin Center.


## 2. Logic Chain

1. **Top-Level Scope**: The presence of `.sln`, `.csproj`, `.pdb`, and `.cs` files inside each directory indicates these folders contain source code structures for .NET projects.
2. **Decompilation Origin**: The XML comments at the top of each `.csproj` file (e.g. `<!--Project was exported from assembly: ...-->`) confirm that these files are the output of a decompilation tool (such as ILSpy or dotPeek) operating on compiled DLL files.
3. **Execution Platform**: The presence of `<TargetFrameworkVersion>v8.0</TargetFrameworkVersion>` in the majority of projects (such as `System.Speech`, `WindowsAdminCenter`, and `System.Management.Automation`) shows that the Windows Admin Center V2 service runs on .NET 8.0.
4. **Legacy/Compatibility Platform**: The presence of `<TargetFrameworkVersion>v4.8</TargetFrameworkVersion>` in `Microsoft.WindowsAdminCenter.Controllers.ActiveDirectory.csproj` demonstrates that some controller assemblies still target .NET Framework 4.8.
5. **Component Packaging**: The comment in `System.Transactions.Local.csproj` citing it was extracted from `efbundle.exe` indicates that Windows Admin Center embeds self-contained Entity Framework bundles that pack standard .NET library DLLs.


## 3. Caveats

1. **Folder Coverage**: Only 6 representative DLL folders (`System.Speech`, `System.Transactions.Local`, `System.Xaml`, `Controllers\ActiveDirectory`, `Service\WindowsAdminCenter`, `System.Management.Automation`) were analyzed in detail out of the 13 top-level subdirectories and 500+ deep subdirectories (under `Service` and `Controllers`). It is assumed that the uninspected folders follow the same decompiled C# library structure.
2. **Analysis Limits**: This was a read-only static analysis of filenames, directory structure, and csproj metadata. No C# files were compiled or run.


## 4. Conclusion

The directory `C:\navishare\DCFiles\WACV2` hosts decompiled C# source projects of Windows Admin Center (WAC) V2 and its standard .NET framework dependencies. 
- The codebase is split into system/framework library projects (e.g., `System.Speech`, `System.Xaml`, `System.Management.Automation` for PowerShell 7.4.6) and custom WAC application/controller libraries (e.g. `WindowsAdminCenter` service host, `ActiveDirectory` controller).
- WAC V2 utilizes a hybrid architecture targeting primarily .NET 8.0 (`v8.0`), with select modules (like Active Directory controllers) targeting .NET Framework 4.8 (`v4.8`).


## 5. Verification Method

To independently verify these findings:
1. Run `Get-ChildItem -Directory -Path C:\navishare\DCFiles\WACV2` to confirm the list of 13 top-level folders.
2. Inspect the contents of any folder, e.g. `C:\navishare\DCFiles\WACV2\System.Speech\System.Speech.csproj`, to verify the `TargetFrameworkVersion` is indeed `v8.0` and the file list matches this report.
3. Check `C:\navishare\DCFiles\WACV2\Controllers\Microsoft.WindowsAdminCenter.Controllers.ActiveDirectory\Microsoft.WindowsAdminCenter.Controllers.ActiveDirectory.csproj` to confirm `TargetFrameworkVersion` is `v4.8`.
