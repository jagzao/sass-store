#!/usr/bin/env pwsh
#requires -RunAsAdministrator
#requires -Version 5.1
<#
.SYNOPSIS
  Register a daily scheduled task to backup and validate Supabase.

.DESCRIPTION
  Creates a Windows Task Scheduler job that runs at 02:00 every day,
  executes backup-supabase-full.ps1 then validate-supabase-backup.ps1,
  and writes events to the Application log on failure.

Run as Administrator.
.ENVIRONMENT
  BACKUP_DIR, DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
#>

$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path $MyInvocation.MyCommand.Definition -Parent
$BackupScript = Join-Path $RepoRoot 'backup-supabase-full.ps1'
$ValidateScript = Join-Path $RepoRoot 'validate-supabase-backup.ps1'

if (-not (Test-Path $BackupScript)) { throw "No se encontro $BackupScript" }
if (-not (Test-Path $ValidateScript)) { throw "No se encontro $ValidateScript" }

$taskName = 'sass-store-supabase-daily-backup'
$description = 'Backup diario completo de Supabase para recovery total'

# Ensure event source exists
$source = 'sass-store-backup'
if (-not [System.Diagnostics.EventLog]::SourceExists($source)) {
  New-EventLog -LogName Application -Source $source
}

$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$BackupScript`"; if (`$?) { & `"$ValidateScript`" }"
$trigger = New-ScheduledTaskTrigger -Daily -At '02:00'
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -WakeToRun -RunOnlyIfNetworkAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 5)
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask -TaskName $taskName -Description $description -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null

Write-Host "Tarea registrada: $taskName"
Write-Host "Ejecutara todos los dias a las 02:00:"
Write-Host "  1. $BackupScript"
Write-Host "  2. $ValidateScript"
Write-Host "Eventos Windows: Application -> $source"
