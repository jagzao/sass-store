#!/usr/bin/env pwsh
#requires -Version 5.1
<#
.SYNOPSIS
  Full local backup of a Supabase PostgreSQL database for bare-metal recovery.

.DESCRIPTION
  Dumps roles, schema, data, and (optionally) Storage objects to a timestamped
  folder under BACKUP_DIR. Emits a manifest.json with checksums, row counts,
  and DB metadata. Writes a Windows event on failure if run non-interactively.

.ENVIRONMENT
  DATABASE_URL              Direct Postgres URL (port 5432, no PgBouncer).
  SUPABASE_URL              Project URL, e.g. https://<ref>.supabase.co
  SUPABASE_SERVICE_ROLE_KEY Service role key for Storage download.
  BACKUP_DIR                Destination root. Default: C:\backups\sass-store
#>

$ErrorActionPreference = 'Stop'

# -----------------------------------------------------------------------------
# Config
# -----------------------------------------------------------------------------
$BackupRoot = if ($env:BACKUP_DIR) { $env:BACKUP_DIR } else { 'C:\backups\sass-store' }
$DirectDbUrl = $env:DATABASE_URL
$SupabaseUrl = $env:SUPABASE_URL
$ServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY

$EventSource = 'sass-store-backup'
$EventLogName = 'Application'

function Write-BackupEvent {
  param([string]$Message, [int]$Level = 1)
  if (-not [System.Diagnostics.EventLog]::SourceExists($EventSource)) {
    try { New-EventLog -LogName $EventLogName -Source $EventSource } catch {}
  }
  Write-EventLog -LogName $EventLogName -Source $EventSource -EventId 1001 -EntryType $Level -Message $Message
}

function Fail {
  param([string]$Message)
  $full = "[sass-store backup] $Message"
  Write-Error $full
  try { Write-BackupEvent -Message $full -Level 2 } catch {}
  exit 1
}

if (-not $DirectDbUrl) { Fail 'DATABASE_URL no configurada. Usa URL directa (puerto 5432, sin PgBouncer).' }
if ($DirectDbUrl -match ':6543/') { Fail 'DATABASE_URL apunta a PgBouncer (puerto 6543). Usa conexion directa puerto 5432.' }

$timestamp = Get-Date -Format 'yyyy-MM-dd-HHmmss'
$folder = Join-Path $BackupRoot $timestamp
$null = New-Item -ItemType Directory -Path $folder -Force

$logFile = Join-Path $folder 'backup.log'
function Log { param([string]$Message) Add-Content -Path $logFile -Value "$(Get-Date -Format o)  $Message" }

Log "Iniciando backup completo en $folder"

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
function Run-SupabaseDump {
  param(
    [Parameter(Mandatory)] [string]$OutFile,
    [string[]]$ExtraArgs = @()
  )
  $target = Join-Path $folder $OutFile
  $argsList = @('db', 'dump', '--db-url', $DirectDbUrl, '-f', $target) + $ExtraArgs
  Log "supabase $($argsList -join ' ')"
  # ponytail: supabase CLI shim is a .ps1 that fails under Start-Process on Win PS 5.1; invoke via node.
  $supabaseJs = Join-Path $env:APPDATA 'npm\node_modules\supabase\dist\supabase.js'
  if (Test-Path $supabaseJs) {
    $proc = Start-Process -FilePath 'node' -ArgumentList (@($supabaseJs) + $argsList) -NoNewWindow -Wait -PassThru
  } else {
    $proc = Start-Process -FilePath 'supabase' -ArgumentList $argsList -NoNewWindow -Wait -PassThru
  }
  if ($proc.ExitCode -ne 0) { Fail "supabase db dump fallo para $OutFile (exit $($proc.ExitCode))" }
  return $target
}

function Get-FileLines {
  param([string]$Path)
  if (-not (Test-Path $Path)) { return 0 }
  return [int]((Get-Content $Path | Measure-Object -Line).Lines)
}

# -----------------------------------------------------------------------------
# 1. Roles
# -----------------------------------------------------------------------------
Log 'Dump roles...'
$rolesFile = Run-SupabaseDump -OutFile 'roles.sql' -ExtraArgs @('--role-only')
$rolesSize = (Get-Item $rolesFile).Length
if ($rolesSize -lt 100) { Fail 'roles.sql esta casi vacio' }
Log "roles.sql: $rolesSize bytes"

# -----------------------------------------------------------------------------
# 2. Schema
# -----------------------------------------------------------------------------
Log 'Dump schema...'
$schemaFile = Run-SupabaseDump -OutFile 'schema.sql'
$schemaSize = (Get-Item $schemaFile).Length
if ($schemaSize -lt 100) { Fail 'schema.sql esta casi vacio' }
Log "schema.sql: $schemaSize bytes"

# -----------------------------------------------------------------------------
# 3. Data
# -----------------------------------------------------------------------------
Log 'Dump data...'
$dataFile = Run-SupabaseDump -OutFile 'data.sql' -ExtraArgs @('--use-copy', '--data-only')
$dataSize = (Get-Item $dataFile).Length
if ($dataSize -lt 100) { Fail 'data.sql esta casi vacio' }
Log "data.sql: $dataSize bytes"

# -----------------------------------------------------------------------------
# 4. DB metadata + row counts
# -----------------------------------------------------------------------------
Log 'Recolectando metadata y row counts...'
$projectRef = ''
if ($SupabaseUrl -match 'https://([^.]+)\.supabase\.co') { $projectRef = $Matches[1] }
if (-not $projectRef -and $DirectDbUrl -match 'postgres\.([^.]+)@') { $projectRef = $Matches[1] }

$rowCounts = @{}
$extensions = @()
$dbVersion = ''

try {
  $pg = $DirectDbUrl
  # Use psql if available, otherwise fall back to a simple SQL script via postgres CLI wrapper.
  $psql = Get-Command psql -ErrorAction SilentlyContinue
  if ($psql) {
    $countsSql = @"
SELECT jsonb_object_agg(c.relname, c.reltuples::bigint)
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r';
"@
    $tempSql = Join-Path $folder '_counts.sql'
    Set-Content -Path $tempSql -Value $countsSql
    $countsJson = & psql $pg -At -c (Get-Content $tempSql -Raw) 2>$null | Select-Object -Last 1
    Remove-Item $tempSql
    $countsObj = $countsJson | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($countsObj) { $countsObj.PSObject.Properties | ForEach-Object { $rowCounts[$_.Name] = $_.Value } }

    $extSql = "SELECT array_agg(extname) FROM pg_extension;"
    $extArr = & psql $pg -At -c $extSql 2>$null | Select-Object -Last 1
    $extensions = ($extArr -replace '[{}]', '' -split ',') | ForEach-Object { $_.Trim() } | Where-Object { $_ }

    $verSql = "SELECT version();"
    $dbVersion = (& psql $pg -At -c $verSql 2>$null | Select-Object -Last 1) -replace '\s+.*$', ''
  }
}
catch {
  Log "Advertencia: no se pudieron obtener row counts via psql: $_"
}

# Fallback row counts by parsing COPY blocks in data.sql if psql not available.
if ($rowCounts.Count -eq 0 -and (Test-Path $dataFile)) {
  $copyBlocks = Select-String -Path $dataFile -Pattern '^COPY "public"\.(\S+) ' -AllMatches
  foreach ($m in $copyBlocks) {
    $table = $m.Matches[0].Groups[1].Value
    # Count lines until \.
    $start = $m.LineNumber
    $end = $start
    $lines = Get-Content $dataFile
    for ($i = $start; $i -lt $lines.Count; $i++) { if ($lines[$i] -eq '\.') { $end = $i; break } }
    $rowCounts[$table] = [math]::Max(0, $end - $start)
  }
}

# -----------------------------------------------------------------------------
# 5. Storage backup (best-effort)
# -----------------------------------------------------------------------------
$storageFolder = Join-Path $folder 'storage'
$null = New-Item -ItemType Directory -Path $storageFolder -Force
$storageManifest = @{ buckets = @(); objects = @(); filesDownloaded = 0; skipped = $false }

if (-not $SupabaseUrl -or -not $ServiceRoleKey) {
  Log 'Storage skip: faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY'
  $storageManifest.skipped = $true
}
else {
  try {
    Log 'Listando buckets de Storage...'
    $bucketsUri = "$SupabaseUrl/storage/v1/bucket"
    $bucketsResp = Invoke-RestMethod -Uri $bucketsUri -Headers @{
      apikey = $ServiceRoleKey
      Authorization = "Bearer $ServiceRoleKey"
    } -ErrorAction Stop
    $storageManifest.buckets = $bucketsResp | ForEach-Object { $_.id }
    $bucketsResp | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $storageFolder 'buckets.json')

    foreach ($bucket in $bucketsResp) {
      $bucketId = $bucket.id
      $bucketFolder = Join-Path $storageFolder 'files' $bucketId
      $null = New-Item -ItemType Directory -Path $bucketFolder -Force
      Log "Descargando objetos del bucket $bucketId..."

      $objectsUri = "$SupabaseUrl/storage/v1/object/list/$bucketId"
      $body = @{ prefix = ''; limit = 1000; offset = 0 } | ConvertTo-Json -Compress
      $objects = @()
      do {
        $listResp = Invoke-RestMethod -Uri $objectsUri -Method Post -Headers @{
          apikey = $ServiceRoleKey
          Authorization = "Bearer $ServiceRoleKey"
          'Content-Type' = 'application/json'
        } -Body $body -ErrorAction Stop
        $objects += $listResp
        $offset = ($body | ConvertFrom-Json).offset + $listResp.Count
        $body = @{ prefix = ''; limit = 1000; offset = $offset } | ConvertTo-Json -Compress
      } while ($listResp.Count -eq 1000)

      $storageManifest.objects += $objects | ForEach-Object { @{ bucket = $bucketId; name = $_.name; id = $_.id } }

      foreach ($obj in $objects) {
        $name = $obj.name
        $encoded = [System.Web.HttpUtility]::UrlEncode($name)
        $downloadUri = "$SupabaseUrl/storage/v1/object/$bucketId/$encoded"
        $localPath = Join-Path $bucketFolder ($name -replace '/', '\')
        $localDir = Split-Path $localPath -Parent
        if (-not (Test-Path $localDir)) { New-Item -ItemType Directory -Path $localDir -Force | Out-Null }
        try {
          Invoke-RestMethod -Uri $downloadUri -Headers @{
            apikey = $ServiceRoleKey
            Authorization = "Bearer $ServiceRoleKey"
          } -OutFile $localPath -ErrorAction Stop
          $storageManifest.filesDownloaded++
        }
        catch {
          Log "Fallo descarga $bucketId/$name : $_"
        }
      }
    }
  }
  catch {
    Log "Storage backup fallo: $_"
    $storageManifest.skipped = $true
  }
}

$storageManifest | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $storageFolder 'manifest.json')

# -----------------------------------------------------------------------------
# 6. Checksums + manifest
# -----------------------------------------------------------------------------
Log 'Generando checksums...'
$files = Get-ChildItem $folder -File | Where-Object { $_.Name -ne 'backup.log' } | Select-Object -ExpandProperty FullName
$shaLines = @()
foreach ($f in $files) {
  $hash = (Get-FileHash -Path $f -Algorithm SHA256).Hash
  $shaLines += "$hash  $(Split-Path $f -Leaf)"
}
$shaFile = Join-Path $folder 'sha256sums.txt'
Set-Content -Path $shaFile -Value ($shaLines -join "`r`n")

$manifest = @{
  projectRef = ($projectRef -replace ':.*$', '')
  timestamp = $timestamp
  isoTimestamp = (Get-Date -Format o)
  databaseUrlHost = ($DirectDbUrl -replace '.*@', '' -replace ':.*', '')
  files = @{
    roles = @{ name = 'roles.sql'; size = $rolesSize; lines = (Get-FileLines $rolesFile) }
    schema = @{ name = 'schema.sql'; size = $schemaSize; lines = (Get-FileLines $schemaFile) }
    data = @{ name = 'data.sql'; size = $dataSize; lines = (Get-FileLines $dataFile) }
  }
  rowCounts = $rowCounts
  dbVersion = $dbVersion
  extensions = $extensions
  storage = $storageManifest
  retentionDays = 30
} | ConvertTo-Json -Depth 10

$manifestFile = Join-Path $folder 'manifest.json'
Set-Content -Path $manifestFile -Value $manifest

# Symlink/latest pointer
$latest = Join-Path $BackupRoot 'LATEST'
if (Test-Path $latest) { Remove-Item $latest -Recurse -Force }
New-Item -ItemType Junction -Path $latest -Target $folder -Force | Out-Null

# Cleanup older than 30 days
Get-ChildItem $BackupRoot -Directory | Where-Object { $_.Name -match '^\d{4}-\d{2}-\d{2}-\d{6}$' } |
  Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-30) } |
  ForEach-Object { Log "Eliminando backup antiguo $($_.Name)"; Remove-Item $_.FullName -Recurse -Force }

Log 'Backup completo OK'
try { Write-BackupEvent -Message "Backup OK: $folder" -Level 4 } catch {}

Write-Host "Backup OK: $folder"
