[CmdletBinding()]
param(
    [switch] $Build
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $repoRoot 'backend'
$frontendDir = Join-Path $repoRoot 'frontend'
$mavenCmd = Join-Path $repoRoot '.tools\apache-maven-3.9.9\bin\mvn.cmd'
$backendJar = Join-Path $backendDir 'target\spring-erp.jar'
$backendOutLog = Join-Path $backendDir 'backend-postgres.out.log'
$backendErrLog = Join-Path $backendDir 'backend-postgres.err.log'
$frontendOutLog = Join-Path $frontendDir 'frontend.out.log'
$frontendErrLog = Join-Path $frontendDir 'frontend.err.log'

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
            Write-Warning ("Could not stop process on port {0}: {1}" -f $Port, $_.Exception.Message)
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
Write-Host 'Stopping anything already running on ports 8080 and 3000...'
Stop-PortProcess -Port 8080
Stop-PortProcess -Port 3000

if ($Build -or -not (Test-Path $backendJar)) {
    Write-Host 'Building backend JAR...'
    Push-Location $backendDir
    try {
        & $mavenCmd "-Dmaven.repo.local=$repoRoot\.m2\repository" -DskipTests package
    } finally {
        Pop-Location
    }
} else {
    Write-Host 'Using existing backend JAR. Pass -Build to rebuild first.'
}

if (-not (Test-Path $backendJar)) {
    throw "Backend JAR was not found: $backendJar"
}

if (Test-Path $backendOutLog) { Remove-Item -LiteralPath $backendOutLog -Force }
if (Test-Path $backendErrLog) { Remove-Item -LiteralPath $backendErrLog -Force }
if (Test-Path $frontendOutLog) { Remove-Item -LiteralPath $frontendOutLog -Force }
if (Test-Path $frontendErrLog) { Remove-Item -LiteralPath $frontendErrLog -Force }

$backendProcess = Start-Process -FilePath $javaCmd `
    -ArgumentList '-jar', $backendJar, '--spring.profiles.active=postgres', '--server.port=8080' `
    -WorkingDirectory $backendDir `
    -RedirectStandardOutput $backendOutLog `
    -RedirectStandardError $backendErrLog `
    -PassThru

Start-Sleep -Seconds 2
$frontendProcess = Start-Process -FilePath $npmCmd `
    -ArgumentList 'run', 'dev', '--', '--host', '0.0.0.0', '--port', '3000' `
    -WorkingDirectory $frontendDir `
    -RedirectStandardOutput $frontendOutLog `
    -RedirectStandardError $frontendErrLog `
    -PassThru

Write-Host ''
Write-Host 'Project started.'
Write-Host "Backend PID: $($backendProcess.Id)"
Write-Host "Frontend PID: $($frontendProcess.Id)"
Write-Host 'Backend:  http://localhost:8080/api/v1'
Write-Host 'Swagger:  http://localhost:8080/api/v1/swagger-ui/index.html'
Write-Host 'Frontend: http://localhost:3000/'
Write-Host ''
Write-Host 'Run this from the project root with:'
Write-Host '  powershell -ExecutionPolicy Bypass -File .\start.ps1'
