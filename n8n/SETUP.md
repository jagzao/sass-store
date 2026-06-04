# n8n Workflows — Setup Guide

## Importar workflows

1. Abrir n8n en http://127.0.0.1:5678
2. Ir a **Workflows → Import from file**
3. Importar cada JSON de `n8n/workflows/` en este orden:

| Archivo                                 | Propósito                            |
| --------------------------------------- | ------------------------------------ |
| `wa-booking-detect-triggers.json`       | Detecta "haz cita", parsea intent    |
| `wa-booking-process-confirmations.json` | Procesa ✅/❌ del cliente            |
| `wa-appointment-reminder-24h.json`      | Recordatorios 24h antes              |
| `wa-availability-responder.json`        | Responde preguntas de disponibilidad |
| `wa-support-agent.json`                 | Agente de soporte con Claude         |
| `wa-campaign-dispatcher.json`           | Envía campañas programadas           |

4. Para cada workflow: **activar el toggle** (esquina superior derecha)

## Exportar workflows (para versionarlos)

Cuando modifiques un workflow en n8n UI:

1. Abrir el workflow
2. Menú ⋮ → **Download**
3. Guardar el JSON en `n8n/workflows/`
4. Commitear: `git add n8n/workflows/ && git commit -m "chore(n8n): update [nombre] workflow"`

## Credenciales requeridas

Configurar en n8n → Credentials:

- **Supabase**: `sass-store Supabase DB` — connection string directo port 5432
- **WhatsApp**: access token y phone number ID por tenant
- **HTTP Basic Auth**: para llamadas al API interno de Next.js

## Trigger type por workflow

| Workflow            | Trigger actual    | Trigger target (B1)    |
| ------------------- | ----------------- | ---------------------- |
| WA Booking Detect   | Schedule (2 min)  | Webhook (inmediato)    |
| WA Booking Confirm  | Schedule (2 min)  | Webhook (inmediato)    |
| Reminder 24h        | Schedule (hourly) | Schedule (hourly) — ok |
| Availability        | —                 | Webhook (nuevo)        |
| Support Agent       | —                 | Webhook (nuevo)        |
| Campaign Dispatcher | —                 | Schedule (5 min)       |
