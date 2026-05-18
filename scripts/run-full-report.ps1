# run-full-report.ps1
$ErrorActionPreference = "Stop"
$serverLog = Join-Path $PSScriptRoot "..\e2e-server-run.log"
$serverErr = Join-Path $PSScriptRoot "..\e2e-server-run.err"
$reportLog = Join-Path $PSScriptRoot "..\report-test-run3.log"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

# 1. Kill stale
Get-Process | Where-Object {$_.ProcessName -match 'node' -and $_.CommandLine -match 'next start'} | ForEach-Object { try { Stop-Process -Id $_.Id -Force } catch {} }
Start-Sleep -Seconds 2

# 2. Start server
Write-Host "[1/6] Starting E2E server..."
$env:E2E_SKIP_BUILD = "1"
$proc = Start-Process -FilePath "node" -ArgumentList "scripts/start-e2e-server.js" -PassThru -RedirectStandardOutput $serverLog -RedirectStandardError $serverErr -WorkingDirectory $repoRoot
Write-Host "Server PID: $($proc.Id)"

# Wait for ready
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 2
    $log = Get-Content $serverLog -ErrorAction SilentlyContinue | Select-Object -Last 5
    if ($log -match "Ready") { $ready = $true; break }
}
if (-not $ready) {
    Write-Host "Server did not become ready in 60s"
    try { Stop-Process -Id $proc.Id -Force } catch {}
    exit 1
}
Write-Host "[2/6] Server ready"

# 3. Seed tenants
Write-Host "[3/6] Seeding E2E data..."
$tenants = @("wondernails","centro-tenistico","zo-system")
foreach ($t in $tenants) {
    try {
        $body = @{ tenantSlug = $t } | ConvertTo-Json -Compress
        $resp = Invoke-WebRequest -Uri "http://127.0.0.1:3002/api/debug/seed-e2e" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 15 -ErrorAction Stop
        Write-Host "  seed $t : $($resp.StatusCode)"
    } catch {
        Write-Host "  seed $t : ERR $($_.Exception.Message)"
    }
}

# 4. Run Playwright
Write-Host "[4/6] Running Playwright report spec..."
try {
    $output = & npx playwright test tests/e2e/reporte-general-web.spec.ts --project=chromium --reporter=list --timeout=120000 2>&1
    $output | Out-File -FilePath $reportLog -Encoding utf8
    $passLine = $output | Select-String "passed"
    Write-Host "[5/6] Result: $passLine"
} catch {
    $errOut = $_
    $errOut | Out-File -FilePath $reportLog -Encoding utf8 -Append
    Write-Host "[5/6] Playwright exited with error (see $reportLog)"
}

# 5. Stop server
Write-Host "[6/6] Stopping server..."
try { Stop-Process -Id $proc.Id -Force } catch {}
Write-Host "Done."
