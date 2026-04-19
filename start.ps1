$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $repoRoot 'backend'
$frontendDir = Join-Path $repoRoot 'frontend'
$mavenCmd = Join-Path $repoRoot '.tools\apache-maven-3.9.9\bin\mvn.cmd'
$backendJar = Join-Path $backendDir 'target\spring-erp.jar'

function Require-Command {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Name
    )

    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if (-not $command) {
        throw "Required command '$Name' was not found in PATH."
    }

    return $command.Source
}

function Stop-PortProcess {
    param(
        [Parameter(Mandatory = $true)]
        [int] $Port
    )

    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    foreach ($connection in $connections) {
        try {
            Stop-Process -Id $connection.OwningProcess -Force -ErrorAction Stop
            Write-Host "Stopped process on port $Port (PID $($connection.OwningProcess))."
        } catch {
            Write-Warning "Could not stop process on port $Port: $($_.Exception.Message)"
        }
    }
}

if (-not (Test-Path $backendDir)) {
    throw "Backend directory not found: $backendDir"
}

if (-not (Test-Path $frontendDir)) {
    throw "Frontend directory not found: $frontendDir"
}

if (-not (Test-Path $mavenCmd)) {
    throw "Maven wrapper not found: $mavenCmd"
}

$javaCmd = Require-Command -Name 'java.exe'
$npmCmd = Require-Command -Name 'npm.cmd'
$powershellCmd = Require-Command -Name 'powershell.exe'

Write-Host 'Stopping anything already running on ports 8080 and 3000...'
Stop-PortProcess -Port 8080
Stop-PortProcess -Port 3000

Write-Host 'Building backend JAR...'
Push-Location $backendDir
try {
    & $mavenCmd "-Dmaven.repo.local=$repoRoot\.m2\repository" -DskipTests package
} finally {
    Pop-Location
}

if (-not (Test-Path $backendJar)) {
    throw "Backend JAR was not created: $backendJar"
}

$backendCommand = @"
Set-Location '$backendDir'
& '$javaCmd' -jar '$backendJar' --spring.profiles.active=postgres --server.port=8080
"@

$frontendCommand = @"
Set-Location '$frontendDir'
& '$npmCmd' run dev -- --host 0.0.0.0 --port 3000
"@

Start-Process -FilePath $powershellCmd -ArgumentList '-NoExit', '-Command', $backendCommand | Out-Null
Start-Sleep -Seconds 2
Start-Process -FilePath $powershellCmd -ArgumentList '-NoExit', '-Command', $frontendCommand | Out-Null

Write-Host ''
Write-Host 'Project started.'
Write-Host 'Backend:  http://localhost:8080/api/v1'
Write-Host 'Swagger:  http://localhost:8080/api/v1/swagger-ui/index.html'
Write-Host 'Frontend: http://localhost:3000/'
Write-Host ''
Write-Host 'Run this from the project root with:'
Write-Host '  powershell -ExecutionPolicy Bypass -File .\start.ps1'
