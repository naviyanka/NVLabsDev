[Setup]
AppName=NEXUS
AppVersion=1.0.0
DefaultDirName={commonpf}\Nexus
DefaultGroupName=NEXUS
Compression=lzma2
SolidCompression=yes
OutputBaseFilename=Nexus_Setup
OutputDir=.\Output
PrivilegesRequired=admin
AppPublisher=NVLabs
UninstallDisplayIcon={app}\nexus.ico

[Files]
; Backend Files
Source: "Staging\Backend\*"; DestDir: "{app}\Backend"; Flags: ignoreversion recursesubdirs createallsubdirs
; Frontend Files
Source: "Staging\Frontend\*"; DestDir: "{app}\Frontend"; Flags: ignoreversion recursesubdirs createallsubdirs
; Icon
Source: "nexus.ico"; DestDir: "{app}"; Flags: ignoreversion

[Run]
; Run Configuration Script
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -WindowStyle Hidden -File ""{app}\Backend\Configure-Setup.ps1"" -AppPort {code:GetPort} -CertThumbprint ""{code:GetThumbprint}"" -GenerateSelfSigned {code:GetSelfSigned} -HostUrl ""{code:GetHostUrl}"" -AppDomain ""{code:GetDomain}"" -AppPath ""{app}"""; Flags: runhidden waituntilterminated

; Install Backend Service using sc
Filename: "{sys}\sc.exe"; Parameters: "create ""Nexus Backend"" binPath= ""{app}\Backend\Nexus.Gateway.exe"" start= auto"; Flags: runhidden
Filename: "{sys}\sc.exe"; Parameters: "description ""Nexus Backend"" ""Nexus Core API and Management Backend"""; Flags: runhidden
Filename: "{sys}\sc.exe"; Parameters: "start ""Nexus Backend"""; Flags: runhidden

; Install and start Frontend Service using WinSW
Filename: "{app}\Frontend\WinSW.exe"; Parameters: "install"; WorkingDir: "{app}\Frontend"; Flags: runhidden
Filename: "{app}\Frontend\WinSW.exe"; Parameters: "start"; WorkingDir: "{app}\Frontend"; Flags: runhidden

[UninstallRun]
; Stop and delete Frontend Service
Filename: "{app}\Frontend\WinSW.exe"; Parameters: "stop"; WorkingDir: "{app}\Frontend"; Flags: runhidden; RunOnceId: "StopFrontend"
Filename: "{app}\Frontend\WinSW.exe"; Parameters: "uninstall"; WorkingDir: "{app}\Frontend"; Flags: runhidden; RunOnceId: "UninstallFrontend"

; Stop and delete Backend Service
Filename: "{sys}\sc.exe"; Parameters: "stop ""Nexus Backend"""; Flags: runhidden; RunOnceId: "StopBackend"
; Wait for service to stop
Filename: "{cmd}"; Parameters: "/c timeout /T 5 /NOBREAK"; Flags: runhidden
Filename: "{sys}\sc.exe"; Parameters: "delete ""Nexus Backend"""; Flags: runhidden; RunOnceId: "UninstallBackend"

[UninstallDelete]
Type: filesandordirs; Name: "{app}\Backend"
Type: filesandordirs; Name: "{app}\Frontend"
Type: filesandordirs; Name: "{app}"

[Icons]
Name: "{commonprograms}\NEXUS"; Filename: "{app}\Backend\Nexus.Launcher.exe"; IconFilename: "{app}\nexus.ico"
Name: "{commondesktop}\NEXUS"; Filename: "{app}\Backend\Nexus.Launcher.exe"; IconFilename: "{app}\nexus.ico"
Name: "{group}\Uninstall NEXUS"; Filename: "{uninstallexe}"

[Code]
var
  ConfigPage: TInputQueryWizardPage;
  DefaultFQDN: String;
  DefaultDomain: String;

procedure InitializeWizard;
var
  ResultCode: Integer;
  IniFile: String;
begin
  DefaultFQDN := 'localhost';
  DefaultDomain := 'nvlabs.com';
  
  IniFile := ExpandConstant('{tmp}\nexus_install.ini');
  // Run PowerShell silently to get host and domain info
  if Exec('powershell.exe', '-Command "$fqdn = [System.Net.Dns]::GetHostEntry('''').HostName; $domain = (Get-WmiObject Win32_ComputerSystem).Domain; ''[Nexus]'' + [Environment]::NewLine + ''FQDN='' + $fqdn + [Environment]::NewLine + ''Domain='' + $domain | Out-File -FilePath ''' + IniFile + ''' -Encoding ascii"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) then
  begin
    DefaultFQDN := GetIniString('Nexus', 'FQDN', 'localhost', IniFile);
    DefaultDomain := GetIniString('Nexus', 'Domain', 'nvlabs.com', IniFile);
    DeleteFile(IniFile);
  end;

  ConfigPage := CreateInputQueryPage(wpSelectDir,
    'Service Configuration', 'Configure Port, URL, Domain and SSL Certificate',
    'Specify the Host URL, Listening Port, and AD Domain. If you have an existing SSL Certificate, provide its Thumbprint. Leave Thumbprint blank to generate a Self-Signed Certificate.');
  
  ConfigPage.Add('Host URL / FQDN:', False);
  ConfigPage.Values[0] := DefaultFQDN;
  
  ConfigPage.Add('HTTPS Port:', False);
  ConfigPage.Values[1] := '443';
  
  ConfigPage.Add('Active Directory Domain Name:', False);
  ConfigPage.Values[2] := DefaultDomain;
  
  ConfigPage.Add('Certificate Thumbprint (Leave blank for Self-Signed):', False);
  ConfigPage.Values[3] := '';
end;

function GetHostUrl(Param: String): String;
begin
  Result := ConfigPage.Values[0];
end;

function GetPort(Param: String): String;
begin
  Result := ConfigPage.Values[1];
end;

function GetDomain(Param: String): String;
begin
  Result := ConfigPage.Values[2];
end;

function GetThumbprint(Param: String): String;
begin
  Result := ConfigPage.Values[3];
end;

function GetSelfSigned(Param: String): String;
begin
  if Trim(ConfigPage.Values[3]) = '' then
    Result := 'true'
  else
    Result := 'false';
end;
