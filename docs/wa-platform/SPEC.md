# WA Platform — Especificación Técnica

**Versión:** 1.0  
**Estado:** Draft — pendiente implementación  
**Fecha:** 2026-06-04  
**Proyecto:** sass-store multitenant SaaS

---

## 1. Visión general

WA Platform es la capa de mensajería inteligente de sass-store. Permite que cada tenant tenga un agente WhatsApp autónomo capaz de:

- Responder preguntas sobre disponibilidad y servicios en tiempo real
- Agendar citas mediante conversación natural
- Enviar campañas de marketing programadas
- Notificar recordatorios, eventos y envíos
- Escalar a humano cuando sea necesario
- Aprender del historial de cada cliente

El agente opera de forma híbrida: respuestas basadas en reglas para flujos estructurados (booking, disponibilidad, FAQs) y generación con IA (Claude) para conversación abierta. Cada tenant tiene su propia personalidad, contexto y memoria de clientes.

---

## 2. Arquitectura del sistema

### 2.1 Flujo de mensajes (tiempo real)

```
WhatsApp Cloud API (Meta)
          │
          │ POST /api/whatsapp/webhook
          ▼
┌─────────────────────────────────────────────────┐
│              Message Router                      │
│  (apps/web/app/api/whatsapp/webhook/route.ts)   │
│                                                  │
│  1. Verificar firma HMAC-SHA256                  │
│  2. Identificar tenant (phone_number_id → slug)  │
│  3. Cargar sesión activa del cliente (Redis)     │
│  4. Clasificar intent del mensaje                │
│  5. Dispatch INMEDIATO → n8n webhook trigger     │
│  6. Retornar 200 a Meta (< 3 segundos)          │
└──────────────────┬──────────────────────────────┘
                   │ POST http://n8n:5678/webhook/{handler}
           ┌───────┴────────────────────────────┐
           │                                    │
           ▼                                    ▼
    Intent: booking/availability         Intent: campaign_reply
    Intent: support/unknown              Intent: support/faq
           │                                    │
           ▼                                    ▼
  ┌─────────────────┐                  ┌──────────────────┐
  │  Booking Agent  │                  │  Support Agent   │
  │  n8n workflow   │                  │  n8n workflow    │
  └────────┬────────┘                  └────────┬─────────┘
           │                                    │
           ▼                                    ▼
  ┌─────────────────────────────────────────────────────┐
  │              Hybrid Response Engine                  │
  │  packages/wa-platform/src/agent/hybrid.ts           │
  │                                                      │
  │  Rule score > 0.85 → respuesta determinista (< 5ms) │
  │  Rule score 0.5–0.85 → regla + AI personaliza tono  │
  │  Rule score < 0.5   → Claude full con tenant ctx    │
  └──────────────────────────┬──────────────────────────┘
                             │
                             ▼
              WhatsApp Cloud API → cliente
```

### 2.2 Por qué webhook dispatch en vez de polling

|                       | Polling (actual)                    | Webhook dispatch (target)             |
| --------------------- | ----------------------------------- | ------------------------------------- |
| Latencia de respuesta | 0–4 minutos                         | < 3 segundos                          |
| Carga en DB           | Escanea toda la tabla cada 2 min    | Solo escribe al recibir               |
| Escalabilidad         | Limitado por n8n scheduler          | Limitado por n8n workers (horizontal) |
| Costo                 | n8n ejecuta aunque no haya mensajes | n8n solo ejecuta cuando hay mensajes  |

---

## 3. Estructura de carpetas

```
sass-store/
│
├── packages/wa-platform/              # Librería core del WA platform
│   ├── src/
│   │   ├── types/
│   │   │   ├── index.ts               # Re-exports
│   │   │   ├── message.ts             # Tipos de mensajes WA (in/out)
│   │   │   ├── intent.ts              # IntentType, ClassifiedIntent
│   │   │   ├── conversation.ts        # ConversationState, SessionData
│   │   │   ├── campaign.ts            # Campaign, CampaignRecipient, Metrics
│   │   │   └── tenant-config.ts       # TenantWAConfig, TenantPersona
│   │   │
│   │   ├── router/
│   │   │   ├── index.ts               # MessageRouter — entry point
│   │   │   ├── classifier.ts          # Clasifica intent (reglas + ML ligero)
│   │   │   ├── tenant-resolver.ts     # phone_number_id → tenant_slug
│   │   │   └── dispatcher.ts          # Dispatch a n8n webhook triggers
│   │   │
│   │   ├── handlers/
│   │   │   ├── booking.ts             # Flujo de agendado
│   │   │   ├── availability.ts        # Consulta de slots libres
│   │   │   ├── campaign-reply.ts      # Maneja replies a campañas
│   │   │   ├── support.ts             # Responde preguntas libres
│   │   │   └── fallback.ts            # Intent desconocido → escalar
│   │   │
│   │   ├── agent/
│   │   │   ├── brain.ts               # Orquestador del agente
│   │   │   ├── hybrid.ts              # Decisión reglas vs. AI
│   │   │   ├── prompt-builder.ts      # Construye prompts con tenant context
│   │   │   └── sentiment.ts           # Detecta tono negativo → escalar
│   │   │
│   │   ├── memory/
│   │   │   ├── session-store.ts       # Redis: estado de sesión activa
│   │   │   ├── tenant-context.ts      # Carga y cachea conocimiento del tenant
│   │   │   ├── customer-context.ts    # Historial y preferencias del cliente
│   │   │   └── conversation-log.ts    # Guarda historial en Supabase
│   │   │
│   │   ├── campaigns/
│   │   │   ├── dispatcher.ts          # Envía mensajes de campaña
│   │   │   ├── scheduler.ts           # Lee wa_campaigns y los encola
│   │   │   ├── audience-builder.ts    # Construye lista de destinatarios
│   │   │   └── analytics.ts           # Registra sent/delivered/read/replied
│   │   │
│   │   ├── queue/
│   │   │   ├── producer.ts            # Encola mensajes salientes en Redis
│   │   │   └── consumer.ts            # Procesa la cola y llama WA API
│   │   │
│   │   └── templates/
│   │       ├── registry.ts            # Catálogo de plantillas aprobadas
│   │       ├── renderer.ts            # Renderiza plantilla + variables
│   │       └── validator.ts           # Valida que la plantilla existe en Meta
│   │
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── router/
│   │   │   │   ├── classifier.spec.ts
│   │   │   │   └── tenant-resolver.spec.ts
│   │   │   ├── agent/
│   │   │   │   ├── hybrid.spec.ts
│   │   │   │   └── prompt-builder.spec.ts
│   │   │   ├── memory/
│   │   │   │   ├── session-store.spec.ts
│   │   │   │   └── tenant-context.spec.ts
│   │   │   └── handlers/
│   │   │       ├── booking.spec.ts
│   │   │       └── availability.spec.ts
│   │   ├── integration/
│   │   │   ├── webhook-to-n8n.spec.ts    # Webhook → dispatch → n8n
│   │   │   ├── booking-flow.spec.ts      # Flujo completo de booking
│   │   │   └── campaign-send.spec.ts     # Envío de campaña end-to-end
│   │   └── fixtures/
│   │       ├── wa-messages.ts            # Mensajes WA de ejemplo
│   │       ├── tenant-configs.ts         # Configs de tenant de prueba
│   │       └── conversations.ts          # Conversaciones de ejemplo
│   │
│   └── package.json
│
├── tests/
│   └── e2e/
│       └── wa-platform/
│           ├── booking-conversation.spec.ts   # Simula conversación completa
│           ├── availability-query.spec.ts     # Pregunta disponibilidad
│           ├── campaign-broadcast.spec.ts     # Envío masivo
│           └── multi-tenant-isolation.spec.ts # Aislamiento entre tenants
│
├── n8n/
│   ├── workflows/                         # Todos los workflows versionados
│   │   ├── wa-booking-detect-triggers.json
│   │   ├── wa-booking-process-confirmations.json
│   │   ├── wa-appointment-reminder-24h.json
│   │   ├── wa-availability-responder.json  # NUEVO
│   │   ├── wa-support-agent.json           # NUEVO
│   │   └── wa-campaign-dispatcher.json     # NUEVO
│   └── SETUP.md                           # Instrucciones de importación
│
├── docker/
│   ├── wa-platform/
│   │   ├── docker-compose.yml             # Stack completo (redis, n8n, app)
│   │   ├── docker-compose.dev.yml         # Overrides para desarrollo
│   │   ├── docker-compose.test.yml        # Overrides para tests (redis mock)
│   │   └── .env.example                   # Variables requeridas
│   └── n8n/
│       ├── docker-compose.yml             # n8n standalone
│       └── .env.example
│
└── apps/web/app/api/whatsapp/
    ├── webhook/route.ts                   # MODIFICAR: agregar router
    └── availability/route.ts              # NUEVO: GET slots libres
```

---

## 4. Multi-tenant

### 4.1 Identificación de tenant

Cada tenant registra su número de WhatsApp Business en la plataforma. El campo `phone_number_id` de Meta identifica unívocamente al tenant:

```sql
-- Nueva tabla en schema.ts
wa_tenant_config (
  id              UUID PK,
  tenant_slug     VARCHAR(100) UNIQUE NOT NULL,
  phone_number_id VARCHAR(50)  UNIQUE NOT NULL,  -- de Meta Dashboard
  display_name    VARCHAR(100),                  -- "Wonder Nails Studio"
  bot_name        VARCHAR(50),                   -- "Sofía" / "Asistente"
  tone            ENUM('formal','amigable','juvenil'),
  greeting_msg    TEXT,
  fallback_msg    TEXT,                          -- cuando bot no entiende
  escalation_msg  TEXT,                          -- cuando pasa a humano
  escalation_phone VARCHAR(20),                  -- número del admin
  ai_enabled      BOOLEAN DEFAULT true,
  max_ai_tokens   INTEGER DEFAULT 300,
  features        JSONB,                         -- feature flags por tenant
  created_at      TIMESTAMPTZ DEFAULT NOW()
)
```

Resolución en el webhook (< 1ms con cache):

```
phone_number_id llegó en el payload
      ↓
Redis: GET wa:tenant:{phone_number_id}
      ↓
  HIT → tenant_slug (inmediato)
  MISS → Supabase query → guardar en Redis TTL=1h
```

### 4.2 Aislamiento de datos

- Cada sesión de conversación tiene prefix `wa:session:{tenant_slug}:{phone}`
- Cada knowledge base tiene prefix `wa:kb:{tenant_slug}`
- Las campañas y automatizaciones están RLS-filtradas por tenant_slug
- Los logs de conversación incluyen tenant_slug para auditoría

### 4.3 Feature flags por tenant

```json
{
  "booking_enabled": true,
  "availability_queries": true,
  "ai_support": true,
  "campaigns_enabled": false,
  "human_handoff": true,
  "max_concurrent_sessions": 50
}
```

---

## 5. Capacidad estimada

### 5.1 Arquitectura con Redis queue (target)

| Métrica                     | Con polling actual | Con webhook + Redis queue |
| --------------------------- | ------------------ | ------------------------- |
| Latencia de respuesta       | 0–4 minutos        | 1–5 segundos              |
| Conversaciones simultáneas  | ~30                | ~500                      |
| Conversaciones/día (total)  | ~2,000             | ~50,000                   |
| Tenants activos simultáneos | 3–5                | 20–50                     |
| Costo por mensaje (infra)   | ~$0.002            | ~$0.0005                  |

### 5.2 Límites reales por capa

```
Meta (WhatsApp API)
  └─ 80 mensajes/segundo por phone number
  └─ Sin límite en inbound

Next.js webhook
  └─ 1,000+ req/seg (Vercel/EC2)
  └─ Bottleneck: Supabase connection pool (max 20 conns en free)

Redis (sesiones)
  └─ 100,000 ops/seg en una instancia Upstash
  └─ 10,000 sesiones activas simultáneas con TTL=30min

n8n workers
  └─ 1 worker: ~10 ejecuciones simultáneas por workflow
  └─ 3 workers: ~30 simultáneas (suficiente para 20 tenants)

Supabase (escrituras de conversación)
  └─ 500 req/seg en plan Pro
  └─ Para 50 tenants con 100 conv/día: ~3 req/seg (muy holgado)
```

### 5.3 Proyección por escenario

| Escenario       | Tenants activos | Conv/día/tenant | Total conv/día | Infra necesaria                  |
| --------------- | --------------- | --------------- | -------------- | -------------------------------- |
| MVP             | 5               | 30              | 150            | Upstash free + n8n 1 worker      |
| Crecimiento     | 15              | 80              | 1,200          | Upstash 100K/día + n8n 2 workers |
| Escala          | 50              | 150             | 7,500          | Redis dedicado + n8n 5 workers   |
| Límite práctico | 100             | 300             | 30,000         | Redis cluster + n8n horizontal   |

**Conclusión**: la arquitectura propuesta puede manejar hasta **30,000 conversaciones/día** con infraestructura razonable. El cuello de botella real a esa escala es el pool de conexiones de Supabase, resoluble con PgBouncer o plan Enterprise.

---

## 6. Capa de respuestas híbridas

### 6.1 Flujo de decisión

```
Mensaje entrante
       │
       ▼
[Rule Engine] → confidence_score: 0.0–1.0
       │
  ┌────┴──────────────────┐
  │                       │
score > 0.85           score < 0.85
  │                       │
  ▼                  score 0.50–0.85?
Respuesta             ┌───┴───┐
determinista         YES      NO
(regla exacta)        │        │
< 5ms, free           ▼        ▼
                  Hybrid    Full AI
                  (regla   (Claude +
                  + AI     tenant
                  tono)    context)
                  ~800ms   ~1.5s + costo
```

### 6.2 Reglas con alta confianza (no necesitan AI)

| Intent        | Keywords                                      | Respuesta                  |
| ------------- | --------------------------------------------- | -------------------------- |
| booking_start | "haz cita", "quiero cita", "agendar"          | Inicia flujo de booking    |
| availability  | "disponibilidad", "tienen hora", "qué días"   | Llama /api/availability    |
| pricing       | "cuánto cuesta", "precio", "qué cobran"       | Lista servicios del tenant |
| hours         | "horario", "a qué hora abren", "hasta cuándo" | Horario del tenant         |
| location      | "dónde están", "dirección", "cómo llego"      | Dirección del tenant       |
| confirm_yes   | "sí", "confirmar", "dale", "va"               | Confirma booking pendiente |
| confirm_no    | "no", "cancelar", "mejor no"                  | Cancela booking pendiente  |
| human_request | "hablar con alguien", "quiero persona real"   | Escalation                 |

### 6.3 Casos que requieren AI

- Preguntas compuestas: "¿tienes algo para uñas acrílicas el martes pero barato?"
- Quejas o comentarios negativos
- Preguntas que no matchean ningún patrón
- Conversación de seguimiento sin contexto claro
- Cuando el estado es `BROWSING` sin intent claro

### 6.4 Construcción del prompt (con contexto de tenant)

```typescript
// packages/wa-platform/src/agent/prompt-builder.ts

const systemPrompt = `
Eres ${config.botName}, asistente virtual de ${config.displayName}.
Tono: ${config.tone}. Idioma: español mexicano.

SERVICIOS DISPONIBLES:
${services.map((s) => `- ${s.name}: $${s.price} MXN (${s.duration}min)`).join("\n")}

HORARIO:
${formatHours(config.hours)}

REGLAS:
- Si el cliente quiere agendar, recopila: servicio, fecha y hora
- Si preguntan precio, solo menciona los de la lista
- Si no sabes algo, di "voy a verificar con el equipo"
- Nunca inventes información sobre servicios o precios
- Máx ${config.maxTokens} tokens por respuesta
- Si el cliente está molesto o pide hablar con alguien: escalar

HISTORIAL DE ESTA CONVERSACIÓN:
${conversationHistory
  .slice(-6)
  .map((m) => `${m.role}: ${m.content}`)
  .join("\n")}
`;
```

---

## 7. Gestión de conversaciones y memoria del agente

### 7.1 Máquina de estados por conversación

```
IDLE ──────────────────────────────────────────────────────┐
  │                                                         │
  │ primer mensaje                                          │
  ▼                                                         │
GREETED                                                     │
  │                                                         │
  ├─ intent: booking_start ──────► COLLECTING_BOOKING       │
  │                                      │                  │
  │                                      │ todos los datos  │
  │                                      ▼                  │
  │                               AWAITING_CONFIRM          │
  │                                      │                  │
  │                               ┌──────┴──────┐          │
  │                              YES            NO          │
  │                               │              │          │
  │                               ▼              ▼          │
  │                           CONFIRMED      CANCELLED ─────┘
  │
  ├─ intent: availability ───────► BROWSING ───────────────┐
  │                                                        │
  │                        (puede transicionar a booking) ─┘
  │
  ├─ intent: support ────────────► SUPPORT_ACTIVE
  │                                      │
  │                              max_turns o escalation
  │                                      ▼
  └─ intent: human_request ─────► ESCALATED ──────────────► IDLE (30min timeout)
```

### 7.2 Capas de memoria

```
┌──────────────────────────────────────────────────────────┐
│  L1: Working Memory (Redis, TTL = 30 minutos)            │
│  ─────────────────────────────────────────────────────── │
│  Key: wa:session:{tenant_slug}:{phone}                   │
│  Contenido:                                              │
│    - state: ConversationState                            │
│    - messages: últimos 10 mensajes (contexto para AI)    │
│    - pending_booking: { service, date, time }            │
│    - last_intent: string                                 │
│    - customer_id: UUID (si se identificó)                │
│    - turn_count: número de turnos en la sesión           │
│    - started_at: timestamp                               │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  L2: Episodic Memory (Supabase, persistente)             │
│  ─────────────────────────────────────────────────────── │
│  Tabla: wa_customer_memory                               │
│  ─ Preferencias detectadas en conversaciones anteriores  │
│    ("siempre pide gel", "prefiere citas tarde")          │
│  ─ Historial de bookings desde WhatsApp                  │
│  ─ Temas de conversaciones pasadas                       │
│  ─ Última vez que interactuó                             │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  L3: Semantic Memory / Knowledge Base (Redis, TTL=1h)    │
│  ─────────────────────────────────────────────────────── │
│  Key: wa:kb:{tenant_slug}                                │
│  Fuente: Supabase (services, calendar_settings, tenant)  │
│  Contenido:                                              │
│    - servicios con precios y duraciones                  │
│    - horarios de operación por día                       │
│    - FAQs configuradas por el tenant                     │
│    - personalidad del bot (nombre, tono, saludos)        │
│    - staff disponible                                    │
│  Invalidación: cuando admin modifica servicios u horarios│
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  L4: Tenant Config (env + DB, inmutable en runtime)      │
│  ─────────────────────────────────────────────────────── │
│  - phone_number_id → tenant_slug mapping                 │
│  - API keys de WhatsApp por tenant                       │
│  - Feature flags (booking, AI, campaigns habilitados)    │
│  - Límites (max_concurrent_sessions, max_ai_calls/day)   │
└──────────────────────────────────────────────────────────┘
```

### 7.3 Ciclo de vida de una sesión

```
Cliente envía primer mensaje
  → crear sesión en Redis (TTL 30min)
  → cargar knowledge base del tenant (si no está en cache)
  → buscar customer por phone en Supabase (si existe → L2 memory)

Durante la conversación
  → cada mensaje reinicia el TTL de sesión a 30min
  → cada turno se guarda en wa_conversation_history (Supabase)
  → si se detecta preferencia → actualizar L2 (wa_customer_memory)

Sesión termina
  → por timeout (TTL expirado en Redis)
  → por booking confirmado
  → por escalación a humano
  → por el cliente diciendo "gracias", "bye", etc.

Post-sesión
  → resumen de la conversación guardado en L2
  → métricas actualizadas en wa_session_metrics
```

---

## 8. Campañas y automatizaciones

### 8.1 Tipos de mensajes outbound

| Tipo               | Trigger                     | Template Meta requerido     |
| ------------------ | --------------------------- | --------------------------- |
| Reminder 24h       | automático (cron)           | Sí (`booking_reminder_24h`) |
| Reminder 1h        | automático (cron)           | Sí                          |
| Retouch 15 días    | automático (cron)           | Sí                          |
| Campaña manual     | admin programa fecha        | Sí (body de campaña)        |
| Campaña por evento | rule trigger                | Sí                          |
| Reply a inbound    | cliente inicia conversación | No (dentro de 24h window)   |

> **Regla de Meta**: para mensajes que el negocio inicia (fuera de 24h desde el último mensaje del cliente), se requiere template aprobado. Dentro de la ventana de 24h, se puede enviar texto libre.

### 8.2 Schema de campañas

```sql
wa_campaigns (
  id              UUID PK,
  tenant_slug     VARCHAR(100) NOT NULL,
  name            VARCHAR(255),
  status          ENUM('draft','scheduled','sending','completed','failed'),
  message_template_id VARCHAR(100),    -- template aprobado en Meta
  template_vars   JSONB,               -- variables del template
  audience_type   ENUM('all','segment','manual'),
  audience_filter JSONB,               -- { tags: [...], last_visit_days: 30 }
  scheduled_at    TIMESTAMPTZ,
  sent_count      INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count      INTEGER DEFAULT 0,
  reply_count     INTEGER DEFAULT 0,
  created_by      UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW()
)

wa_automation_rules (
  id              UUID PK,
  tenant_slug     VARCHAR(100) NOT NULL,
  name            VARCHAR(255),
  enabled         BOOLEAN DEFAULT true,
  trigger_event   VARCHAR(100),   -- 'booking_confirmed' | 'customer_inactive_30d' | ...
  conditions      JSONB,           -- condiciones adicionales
  action_type     VARCHAR(50),    -- 'send_template' | 'send_text' | 'escalate'
  action_config   JSONB,          -- template_id, message, delay_minutes
  created_at      TIMESTAMPTZ DEFAULT NOW()
)
```

---

## 9. n8n workflows (arquitectura)

### 9.1 Workflows a mantener

| Archivo                                 | Trigger                      | Rol                                                             |
| --------------------------------------- | ---------------------------- | --------------------------------------------------------------- |
| `wa-booking-detect-triggers.json`       | **Webhook** (no más polling) | Detecta "haz cita", parsea intent, guarda estado, envía botones |
| `wa-booking-process-confirmations.json` | **Webhook** (no más polling) | Procesa ✅/❌, crea booking o cancela                           |
| `wa-appointment-reminder-24h.json`      | Cron (hourly)                | Envía recordatorios 24h antes                                   |
| `wa-availability-responder.json`        | Webhook                      | Llama /api/availability, formatea respuesta, envía              |
| `wa-support-agent.json`                 | Webhook                      | Llama Claude API con tenant context, envía respuesta            |
| `wa-campaign-dispatcher.json`           | Cron (cada 5 min)            | Lee wa_campaigns scheduled, envía y actualiza métricas          |

### 9.2 Migración de polling a webhook trigger

**Antes (polling)**:

```
ScheduleTrigger (cada 2 min)
  → escanea DB buscando mensajes
  → procesa si encuentra algo
  → espera 2 min más
```

**Después (webhook)**:

```
Next.js webhook recibe mensaje
  → clasifica intent
  → POST a http://n8n:5678/webhook/wa-booking
    con payload: { phone, tenantSlug, message, sessionState }
  → n8n procesa INMEDIATAMENTE
  → responde al cliente en < 3 segundos
```

---

## 10. Admin UI para tenants

Ruta: `/t/[tenant]/admin/whatsapp/`

```
/admin/whatsapp/
  ├── dashboard        → métricas: conversaciones, booking rate, response time
  ├── campaigns/       → crear, programar, ver resultados de campañas
  ├── automations/     → reglas if-this-then-that
  ├── bot-config/      → nombre del bot, tono, mensaje de bienvenida, FAQs
  ├── templates/       → gestionar plantillas aprobadas por Meta
  └── conversations/   → historial de conversaciones (lectura)
```

---

## 11. Nuevas tablas de DB requeridas

```sql
-- Configuración WA por tenant
wa_tenant_config (ver sección 4.1)

-- Memoria de cliente por tenant
wa_customer_memory (
  id              UUID PK,
  tenant_slug     VARCHAR(100) NOT NULL,
  phone           VARCHAR(20) NOT NULL,
  customer_id     UUID,                   -- FK a customers si existe
  preferences     JSONB,                  -- {"services": ["gel"], "time": "tarde"}
  conversation_notes TEXT[],              -- notas del historial
  last_interaction TIMESTAMPTZ,
  total_bookings  INTEGER DEFAULT 0,
  UNIQUE(tenant_slug, phone)
)

-- Historial completo de conversaciones
wa_conversation_history (
  id              UUID PK,
  tenant_slug     VARCHAR(100) NOT NULL,
  phone           VARCHAR(20) NOT NULL,
  session_id      VARCHAR(100),           -- ID de la sesión Redis
  direction       ENUM('inbound','outbound'),
  content         TEXT NOT NULL,
  intent          VARCHAR(50),
  handler         VARCHAR(50),            -- qué handler procesó el mensaje
  ai_used         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
)

-- Campañas (ver sección 8.2)
wa_campaigns (...)
wa_automation_rules (...)
```

---

## 12. Roadmap de implementación

| Bloque | Contenido                                                                  | Dependencias | Prioridad |
| ------ | -------------------------------------------------------------------------- | ------------ | --------- |
| **B1** | Router reactivo: webhook dispatch → n8n webhook triggers. Elimina polling. | Redis config | P0        |
| **B2** | Multi-tenant: tabla wa_tenant_config + tenant resolver                     | B1           | P0        |
| **B3** | Availability API + bot responde disponibilidad                             | B1, B2       | P1        |
| **B4** | Session store en Redis + conversation state machine                        | B1, B2       | P1        |
| **B5** | Hybrid response engine + Claude integration                                | B4           | P2        |
| **B6** | Campañas: DB schema + n8n dispatcher + admin UI básica                     | B2           | P2        |
| **B7** | Automatizaciones (if-this-then-that)                                       | B6           | P3        |
| **B8** | Admin UI completa + analytics                                              | B6, B7       | P3        |

B1+B2+B3+B4 son la base. Sin ellos, todo lo demás se construye sobre arena.

---

## 13. Variables de entorno requeridas

```bash
# Por tenant (registrado en wa_tenant_config)
# No son variables de entorno — se guardan en DB encriptadas

# Globales de plataforma
WHATSAPP_APP_SECRET=          # secret de la Meta App (verificación HMAC)
WHATSAPP_WEBHOOK_VERIFY_TOKEN= # token de verificación del webhook

# Redis (Upstash o propio)
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

# Claude AI (para hybrid layer)
ANTHROPIC_API_KEY=

# n8n
N8N_BASE_URL=http://127.0.0.1:5678
N8N_WEBHOOK_SECRET=           # para autenticar dispatch desde Next.js a n8n
```
