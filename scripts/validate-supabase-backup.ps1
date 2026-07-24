#!/usr/bin/env pwsh
#requires -Version 5.1
<#
.SYNOPSIS
  Validate the most recent local Supabase backup.

.DESCRIPTION
  Checks the latest backup folder for non-empty dumps, valid checksums,
  minimum object counts, and (if psql available) compares remote row counts
  against local COPY counts. Writes a Windows event on failure.

.ENVIRONMENT
  BACKUP_DIR      Backup root. Default C:\backups\sass-store
  DATABASE_URL    Optional remote URL to compare row counts.
#>

$ErrorActionPreference = 'Stop'

$BackupRoot = if ($env:BACKUP_DIR) { $env:BACKUP_DIR } else { 'C:\backups\sass-store' }
$DirectDbUrl = $env:DATABASE_URL

$EventSource = 'sass-store-backup'
$EventLogName = 'Application'

function Write-BackupEvent {
  param([string]$Message, [int]$Level = 1)
  if (-not [System.Diagnostics.EventLog]::SourceExists($EventSource)) {
    try { New-EventLog -LogName $EventLogName -Source $EventSource } catch {}
  }
  Write-EventLog -LogName $EventLogName -Source $EventSource -EventId 1002 -EntryType $Level -Message $Message
}

function Fail {
  param([string]$Message)
  $full = "[sass-store backup validate] $Message"
  Write-Error $full
  try { Write-BackupEvent -Message $full -Level 2 } catch {}
  exit 1
}

# Find latest backup
$latest = Get-ChildItem $BackupRoot -Directory |
  Where-Object { $_.Name -match '^\d{4}-\d{2}-\d{2}-\d{6}$' } |
  Sort-Object Name -Descending | Select-Object -First 1

if (-not $latest) { Fail "No hay carpetas de backup en $BackupRoot" }

$folder = $latest.FullName
function Log { param([string]$Message) Add-Content -Path (Join-Path $folder 'validate.log') -Value "$(Get-Date -Format o)  $Message" }

Log "Validando backup: $folder"

$manifestFile = Join-Path $folder 'manifest.json'
$manifest = Get-Content $manifestFile -Raw | ConvertFrom-Json -ErrorAction Stop

# 1. Check files exist and non-empty
$required = @('roles.sql','schema.sql','data.sql','sha256sums.txt','manifest.json')
foreach ($f in $required) {
  $p = Join-Path $folder $f
  if (-not (Test-Path $p)) { Fail "Falta archivo requerido: $f" }
  if ((Get-Item $p).Length -lt 100) { Fail "Archivo muy pequeno: $f" }
}

# 2. Verify checksums
$shaFile = Join-Path $folder 'sha256sums.txt'
$shaLines = Get-Content $shaFile | Where-Object { $_ }
foreach ($line in $shaLines) {
  $parts = $line -split '\s+', 2
  $expected = $parts[0]
  $name = $parts[1]
  $path = Join-Path $folder $name
  if (-not (Test-Path $path)) { Fail "Checksum referencia archivo inexistente: $name" }
  $actual = (Get-FileHash -Path $path -Algorithm SHA256).Hash
  if ($expected -ne $actual) { Fail "Checksum invalido para $name" }
}
Log 'Checksums OK'

# 3. Minimum object counts from schema.sql
$schema = Get-Content (Join-Path $folder 'schema.sql') -Raw
$tables = [regex]::Matches($schema, 'CREATE TABLE IF NOT EXISTS "public"\."(\w+)"').Groups | Select-Object -Skip 1 | ForEach-Object { $_.Value } | Sort-Object -Unique
$functions = [regex]::Matches($schema, 'CREATE (?:OR REPLACE )?FUNCTION(?: "public"\.)?"?(\w+)"?').Groups | Select-Object -Skip 1 | ForEach-Object { $_.Value } | Sort-Object -Unique
$triggers = [regex]::Matches($schema, 'CREATE TRIGGER (\w+)').Groups | Select-Object -Skip 1 | ForEach-Object { $_.Value } | Sort-Object -Unique
$policies = [regex]::Matches($schema, 'CREATE POLICY (\w+)').Groups | Select-Object -Skip 1 | ForEach-Object { $_.Value } | Sort-Object -Unique

if ($tables.Count -lt 5) { Fail "Schema no contiene suficientes tablas: $($tables.Count)" }
Log "Schema OK: $($tables.Count) tablas, $($functions.Count) funciones, $($triggers.Count) triggers, $($policies.Count) politicas"

# 4. Verify roles.sql has at least one role
$roles = Get-Content (Join-Path $folder 'roles.sql') -Raw
if (-not ($roles -match 'CREATE ROLE|ALTER ROLE')) { Fail 'roles.sql no contiene roles' }
Log 'Roles OK'

# 5. Data dump contains COPY for core tables
$data = Get-Content (Join-Path $folder 'data.sql') -Raw
$core = @('tenants','users','bookings','products','services','customers','orders','payments')
foreach ($t in $core) {
  $pattern = 'COPY "public"\."' + $t + '" '
  if ($data -notmatch $pattern) { Fail "data.sql no contiene COPY para $t" }
}
Log 'Data OK: core tables presentes'

# 6. Compare remote row counts if possible
$remoteCounts = @{}
if ($DirectDbUrl -and -not ($DirectDbUrl -match 'localhost')) {
  try {
    $psql = Get-Command psql -ErrorAction SilentlyContinue
    if ($psql) {
      $countsSql = @"
SELECT jsonb_object_agg(c.relname, c.reltuples::bigint)
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r';
"@
      $countsJson = & psql $DirectDbUrl -At -c $countsSql 2>$null | Select-Object -Last 1
      $remoteObj = $countsJson | ConvertFrom-Json -ErrorAction SilentlyContinue
      if ($remoteObj) { $remoteObj.PSObject.Properties | ForEach-Object { $remoteCounts[$_.Name] = $_.Value } }
    }
  }
  catch { Log "No se pudieron obtener row counts remotos: $_" }
}

if ($remoteCounts.Count -gt 0 -and $manifest.rowCounts) {
  $manifestCounts = @{}
  $manifest.rowCounts.PSObject.Properties | ForEach-Object { $manifestCounts[$_.Name] = $_.Value }
  foreach ($t in $core) {
    if ($remoteCounts.ContainsKey($t)) {
      $remote = $remoteCounts[$t]
      $local = $manifestCounts[$t]
      if ($remote -ne $local) {
        # Allow small reltuples estimation variance
        $ratio = if ($local -gt 0) { [math]::Abs($remote - $local) / $local } else { [math]::Abs($remote - $local) }
        if ($ratio -gt 0.1 -and [math]::Abs($remote - $local) -gt 5) {
          Fail "Row count diverge para $t : remoto=$remote backup=$local"
        }
      }
    }
  }
  Log 'Row counts OK'
}

# 7. Storage manifest exists (if skipped, warn only)
$storageManifestFile = Join-Path $folder 'storage\manifest.json'
if (-not (Test-Path $storageManifestFile)) {
  Log 'ADVERTENCIA: no hay manifest de Storage'
}

Log 'Validacion completa OK'
try { Write-BackupEvent -Message "Validate OK: $folder" -Level 4 } catch {}
Write-Host "Validate OK: $folder"
