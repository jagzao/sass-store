# Política de Triage de Incidentes

> Revisión: 2026-05-26 · Responsable: Dev Lead

---

## Severidades

| Nivel            | Criterio                                                                                            | SLA respuesta | SLA resolución |
| ---------------- | --------------------------------------------------------------------------------------------------- | ------------- | -------------- |
| **P0 — Crítico** | Plataforma completamente caída; pérdida de datos; brecha de seguridad activa                        | 15 min        | 2 h            |
| **P1 — Alto**    | Función clave rota para todos los tenants o para un tenant de producción (checkout, auth, bookings) | 1 h           | 8 h            |
| **P2 — Medio**   | Función degradada; afecta a un subconjunto de usuarios; workaround disponible                       | 4 h           | 48 h           |
| **P3 — Bajo**    | Problema cosmético o de baja frecuencia; no bloquea flujos de negocio                               | 24 h          | 1 semana       |

---

## Árbol de diagnóstico rápido

```
¿El servidor responde?  →  GET /api/health
  ├─ 5xx / timeout       →  reiniciar proceso Next.js, verificar DB
  └─ 200                 →  continuar

¿La DB responde?        →  health.checks.database.status
  ├─ error               →  verificar pool PG, credenciales, RLS
  └─ warn (latencia)     →  optimizar query o agregar índices

¿Auth falla?            →  revisar /api/auth/session (200 vs 401)
  ├─ 401 genérico        →  comprobar NEXTAUTH_SECRET, callbacks de NextAuth
  └─ 403 tenant          →  verificar x-tenant header en middleware

¿Logs ruidosos?         →  revisar DomainLogger por dominio:
  ├─ tenantLogger        →  middleware + resolver.ts
  ├─ financeLogger       →  use-finance.ts, pos/page, reports/page
  ├─ cartLogger          →  cart-store.ts, CartSyncProvider
  └─ authLogger          →  hooks/useTenantGuard, GoogleAuthBinder
```

---

## Checklist de primera respuesta

- [ ] **Identificar** ruta/tenant/usuario afectado
- [ ] **Reproducir** en local con `npm run dev` (puerto 3003 si hay otro corriendo)
- [ ] **Verificar** `GET /api/health` y `GET /api/system/status`
- [ ] **Revisar** logs de servidor (Next.js stdout) — buscar `[tenant]` / `[finance]` / `[auth]`
- [ ] **Comprobar** consola de browser — descartar errores de red 4xx/5xx
- [ ] **Asignar** severidad P0–P3 y documentar en TODOS.md

---

## Runbooks por área

### Auth / Sesión

- Síntoma: pantalla de login en bucle, `session` siempre `null`
- Causas comunes: `NEXTAUTH_SECRET` distinto en prod vs dev; callback URL mal configurada; cookie `SameSite` bloqueada en Safari
- Fix: regenerar secret, verificar `NEXTAUTH_URL` = dominio real, inspeccionar cookies

### Tenant no resuelto

- Síntoma: "Missing x-tenant header", fallback a zo-system
- Causas: host no mapeado en middleware; tenant eliminado de DB; request sin header forwarding
- Fix: verificar `middleware.ts` → `resolvedTenant`; confirmar tenant activo en BD

### Finance / POS

- Síntoma: 400 en `/api/finance/reports/sales` o `/api/finance/pos/sales`
- Causas: falta param `tenant=slug` (reports) o `tenantSlug` en body (POS)
- Fix: ya corregido en `09b7fba`; si reaparece, verificar que el client envía el param

### Logos / Assets 404

- Síntoma: `<img>` rompe; `404 /logos/[tenant].png`
- Causas: branding.logo apunta a `placeholder.zo.dev`
- Fix: `get-tenant.ts` remapea automáticamente (commit `76488aa`); si es un tenant nuevo, crear `/public/tenants/[slug]/logo/logo.svg`

### Ollama / IA no genera

- Síntoma: SmartPublishWizard cae a fallback de texto
- Flujo de tiers: n8n webhook → Ollama local (127.0.0.1:11434) → Ollama Cloud → texto placeholder
- Verificar: `GET http://127.0.0.1:11434/api/tags` debe responder; `OLLAMA_CLOUD_API_KEY` en `.env.local`

### n8n workflow inactivo

- Síntoma: notificaciones WhatsApp no se envían
- Fix: `docker ps | grep n8n` → reiniciar si no corre; revisar workflow ID `lKJ90kB4xqLoZQWC` en `http://127.0.0.1:5678`

---

## Escalación

| Rol             | Cuándo                     | Canal                            |
| --------------- | -------------------------- | -------------------------------- |
| Dev Lead        | P0 / P1 siempre            | DM directo                       |
| PM              | P1 si afecta launch / demo | Slack #incidents                 |
| Infraestructura | P0 DB / DNS                | PagerDuty (pendiente configurar) |

---

## Post-mortem mínimo (P0/P1)

Documentar en `docs/postmortems/YYYY-MM-DD-titulo.md`:

1. **Resumen** (1 párrafo): qué pasó, cuánto duró, impacto
2. **Timeline** (UTC): detección → respuesta → mitigación → resolución
3. **Root cause**: técnica + organizativa
4. **Acciones**: ≥1 preventiva, ≥1 de detección, con owner y fecha límite
