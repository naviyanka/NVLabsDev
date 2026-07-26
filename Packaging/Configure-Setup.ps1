param(
    [string]$AppPort = "443",
    [string]$CertThumbprint = "",
    [string]$GenerateSelfSigned = "false",
    [string]$HostUrl = "",
    [string]$AppDomain = "",
    [string]$AppPath = "C:\Program Files\Nexus"
)

Write-Host "Configuring Nexus Services..."
Write-Host "Port: $AppPort"
Write-Host "Host URL: $HostUrl"
Write-Host "App Domain: $AppDomain"
Write-Host "Cert Thumbprint: $CertThumbprint"
Write-Host "Self Signed: $GenerateSelfSigned"
Write-Host "AppPath: $AppPath"

# Validate HostUrl fallback to localhost if empty
if ([string]::IsNullOrEmpty($HostUrl)) {
    $HostUrl = [System.Net.Dns]::GetHostEntry("").HostName
}
if ([string]::IsNullOrEmpty($HostUrl)) {
    $HostUrl = "localhost"
}

# 1. Handle Certificates
$FinalThumbprint = $CertThumbprint
if ($GenerateSelfSigned -eq "true") {
    Write-Host "Generating Self-Signed Certificate for $HostUrl..."
    try {
        $Cert = New-SelfSignedCertificate -DnsName $HostUrl -CertStoreLocation "cert:\LocalMachine\My" -NotAfter (Get-Date).AddYears(1)
        $FinalThumbprint = $Cert.Thumbprint
        Write-Host "Successfully generated Self-Signed Certificate with Thumbprint: $FinalThumbprint"
    } catch {
        Write-Host "Failed to generate Self-Signed Certificate: $_"
    }
}

# 2. Update Backend appsettings.json dynamically
$AppSettingsPath = "$AppPath\Backend\appsettings.json"
$WebBindingPort = 5011 # Frontend port default

if (Test-Path $AppSettingsPath) {
    $Config = Get-Content $AppSettingsPath | ConvertFrom-Json -Depth 10
    
    # Configure Kestrel
    if ($null -eq $Config.Kestrel) {
        $Config | Add-Member -Type NoteProperty -Name "Kestrel" -Value @{}
    }
    if ($null -eq $Config.Kestrel.Endpoints) {
        $Config.Kestrel | Add-Member -Type NoteProperty -Name "Endpoints" -Value @{}
    }
    
    $HttpsEndpoint = @{
        Url = "https://*:$AppPort"
        Certificate = @{
            Subject = $HostUrl
            Store = "My"
            Location = "LocalMachine"
        }
    }
    
    # If we have a specific thumbprint, bind by thumbprint
    if (![string]::IsNullOrEmpty($FinalThumbprint)) {
        $HttpsEndpoint.Certificate = @{
            Thumbprint = $FinalThumbprint
            Store = "My"
            Location = "LocalMachine"
        }
    }
    
    $Config.Kestrel.Endpoints | Add-Member -Type NoteProperty -Name "Https" -Value $HttpsEndpoint -Force
    
    # Configure custom Nexus settings (synced to database on startup)
    if ($null -eq $Config.Nexus) {
        $Config | Add-Member -Type NoteProperty -Name "Nexus" -Value @{}
    }
    
    # Generate random high port for Frontend to run on HTTP locally (or default 5011)
    $WebBindingPort = 5011
    $Config.Nexus | Add-Member -Type NoteProperty -Name "WebBindingPort" -Value ([int]$WebBindingPort) -Force
    $Config.Nexus | Add-Member -Type NoteProperty -Name "DefaultDomainName" -Value $AppDomain -Force
    $Config.Nexus | Add-Member -Type NoteProperty -Name "HostUrl" -Value $HostUrl -Force
    
    $Config | ConvertTo-Json -Depth 10 | Set-Content $AppSettingsPath
    Write-Host "Updated appsettings.json."
}

# 3. Bind the certificate to the port using netsh
if (![string]::IsNullOrEmpty($FinalThumbprint)) {
    # Generate a random GUID for the app ID
    $AppId = "{7e6a7c3b-7489-4e76-88a4-06180630fa98}"
    
    # Delete existing binding for this port just in case
    netsh http delete sslcert ipport=0.0.0.0:$AppPort 2>$null | Out-Null
    netsh http delete sslcert ipport=[::]:$AppPort 2>$null | Out-Null
    
    # Add new binding
    netsh http add sslcert ipport=0.0.0.0:$AppPort certhash=$FinalThumbprint appid=$AppId
    Write-Host "Bound certificate $FinalThumbprint to port $AppPort"
}

# 4. Update Frontend WinSW.xml dynamically to use the WebBindingPort
$FrontendXmlPath = "$AppPath\Frontend\WinSW.xml"
if (Test-Path $FrontendXmlPath) {
    Write-Host "Configuring Frontend Port $WebBindingPort in WinSW.xml..."
    try {
        [xml]$Xml = Get-Content $FrontendXmlPath
        $PortEnv = $Xml.service.SelectSingleNode("env[@name='PORT']")
        if ($null -eq $PortEnv) {
            $PortEnv = $Xml.CreateElement("env")
            $PortEnv.SetAttribute("name", "PORT")
            $Xml.service.AppendChild($PortEnv) | Out-Null
            $PortEnv = $Xml.service.SelectSingleNode("env[@name='PORT']")
        }
        $PortEnv.SetAttribute("value", $WebBindingPort.ToString())
        $Xml.Save($FrontendXmlPath)
        Write-Host "Successfully updated $FrontendXmlPath PORT env to $WebBindingPort"
    } catch {
        Write-Host "Failed to update $FrontendXmlPath: $_"
    }
}

Write-Host "Configuration complete."
