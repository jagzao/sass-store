# Integración n8n — Cola `scheduled_notifications`

Documento de referencia para el agente que implemente el workflow en **n8n**.  
La aplicación **sass-store** encola notificaciones; **n8n** las consume, envía (WhatsApp Cloud API) y actualiza el estado.

---

## 1. Arquitectura

```
┌─────────────────────┐     INSERT pending      ┌──────────────────────────┐
│  App (Next.js)      │ ──────────────────────► │  scheduled_notifications │
│  PATCH booking      │                         │  (PostgreSQL / Neon)     │
│  reprogramación     │                         └────────────┬─────────────┘
└─────────────────────┘                                      │
                                                             │ poll GET
                                                             ▼
                                                  ┌─────────────────────┐
                                                  │  n8n workflow       │
                                                  │  1. Listar pending  │
                                                  │  2. processing      │
                                                  │  3. Enviar WA API   │
                                                  │  4. sent / failed   │
                                                  └─────────────────────┘
```

**Responsabilidades**

| Componente   | Qué hace                                                                               |
| ------------ | -------------------------------------------------------------------------------------- |
| **App**      | Encola filas (`status = pending`). Hoy: reprogramación de cita desde calendario admin. |
| **n8n**      | Poll cada N minutos, envía WhatsApp, actualiza `sent` o `failed`.                      |
| **Opcional** | Tras `sent`, insertar copia en `whatsapp_messages` (auditoría).                        |

### 1.1 Multitenancy — cola única, contexto por tenant

El sistema es **multitenant**: cada fila lleva `tenant_id` y, en `payload`, `tenantSlug` (ej. `wondernails`, `centro-tenistico`).

| Aspecto              | Comportamiento actual                                                                                                                          | Evolución por tenant                                                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cola**             | Una tabla global `scheduled_notifications`; la app encola con el `tenant_id` de la cita/acción.                                                | Sin cambio.                                                                                                                                     |
| **Poll n8n**         | `GET /api/internal/scheduled-notifications` devuelve pendientes de **todos** los tenants (orden por `scheduled_at`).                           | Filtro opcional: `?tenantSlug=wondernails` si un workflow n8n es solo para un negocio.                                                          |
| **Mensaje**          | `body` ya viene redactado en español con el nombre del negocio (desde datos del tenant al encolar).                                            | Plantillas distintas vía `template_key` + ramas en n8n.                                                                                         |
| **WhatsApp**         | Credenciales **globales** en env: `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN` (misma línea para todos).                                | Si un tenant tiene su propia línea Meta: guardar en `tenant_configs` categoría `notifications` y que n8n lea `payload.tenantSlug` → credencial. |
| **Canales / reglas** | Solo `booking_reschedule` por WhatsApp.                                                                                                        | Recordatorios 24h, confirmación, email/SMS: mismo patrón `template_key` + `payload`.                                                            |
| **RLS**              | Políticas por `tenant_id` para rol `authenticated`; la API interna usa la conexión de servidor (rol con acceso a toda la cola para el worker). | No exponer la API sin `SCHEDULED_NOTIFICATIONS_API_KEY`.                                                                                        |

**Recomendación n8n con varios tenants hoy (una línea WA):**

1. Un solo workflow que hace poll global.
2. En cada item, usar `payload.tenantSlug` solo para logs o ramas de texto futuras.
3. Si más adelante un tenant necesita otra línea o idioma: workflow duplicado con `?tenantSlug=...` o Switch por `template_key`.

**Config futura en app (no implementada aún):** `tenant_configs` con `category = 'notifications'` — horarios de recordatorio, plantillas on/off, teléfono remitente. La app seguiría encolando; n8n solo consumiría.

---

## 2. Base de datos

### Migración

Aplicar antes de probar:

```bash
psql "$DATABASE_URL" -f packages/database/migrations/0017_scheduled_notifications.sql
```

### Tabla `scheduled_notifications`

| Columna                     | Tipo        | Descripción                                         |
| --------------------------- | ----------- | --------------------------------------------------- |
| `id`                        | UUID        | PK                                                  |
| `tenant_id`                 | UUID        | Tenant (multitenant)                                |
| `channel`                   | varchar     | `whatsapp` \| `email` \| `sms`                      |
| `status`                    | varchar     | Ver máquina de estados §3                           |
| `scheduled_at`              | timestamptz | Cuándo puede enviarse (usualmente `now()`)          |
| `processed_at`              | timestamptz | Cuando n8n tomó la fila                             |
| `sent_at`                   | timestamptz | Cuando se marcó enviada                             |
| `recipient_phone`           | varchar     | Teléfono internacional sin `+` (ej. `521234567890`) |
| `recipient_email`           | varchar     | Para canal email (futuro)                           |
| `recipient_name`            | varchar     | Nombre para personalización                         |
| `subject`                   | varchar     | Asunto email (futuro)                               |
| `body`                      | text        | **Texto completo** del mensaje a enviar             |
| `template_key`              | varchar     | Ej. `booking_reschedule`                            |
| `payload`                   | jsonb       | Metadatos (ver §5)                                  |
| `customer_id`               | UUID        | Opcional                                            |
| `booking_id`                | UUID        | Opcional                                            |
| `related_entity_type`       | varchar     | Ej. `booking`                                       |
| `related_entity_id`         | UUID        | Igual que booking_id                                |
| `external_message_id`       | varchar     | ID devuelto por WhatsApp API                        |
| `attempts`                  | int         | Intentos (incrementa en `processing`)               |
| `max_attempts`              | int         | Default 3                                           |
| `last_error`                | text        | Último error si `failed`                            |
| `idempotency_key`           | varchar     | Único; evita duplicados                             |
| `created_by`                | varchar     | Ej. `admin_calendar`                                |
| `created_at` / `updated_at` | timestamptz | Auditoría                                           |

**Índice útil para n8n (poll):**

```sql
SELECT *
FROM scheduled_notifications
WHERE status = 'pending'
  AND scheduled_at <= NOW()
  AND attempts < max_attempts
ORDER BY scheduled_at ASC
LIMIT 50;
```

---

## 3. Máquina de estados

```
pending ──► processing ──► sent
                │
                └──► failed
```

| Estado       | Quién lo pone      | Significado                          |
| ------------ | ------------------ | ------------------------------------ |
| `pending`    | App                | Lista para que n8n la tome           |
| `processing` | n8n                | En vuelo (evita doble envío)         |
| `sent`       | n8n                | Enviada correctamente                |
| `failed`     | n8n                | Error definitivo o superó reintentos |
| `cancelled`  | App/admin (futuro) | Cancelada manualmente                |

**Reintentos:** Si falla el envío, se puede dejar en `failed` o (futuro) volver a `pending` si `attempts < max_attempts`. Hoy el helper de la app no reencola automáticamente.

---

## 4. API HTTP interna (recomendada para n8n)

Base URL de la app: `http://localhost:3001` (dev) o la URL de staging/prod.

### Autenticación

Variable de entorno en el servidor:

```env
SCHEDULED_NOTIFICATIONS_API_KEY=<secreto-largo>
```

En cada request:

```http
Authorization: Bearer <SCHEDULED_NOTIFICATIONS_API_KEY>
```

Alternativa: header `x-api-key: <mismo valor>`.

---

### 4.1 Listar pendientes listos para enviar

```http
GET /api/internal/scheduled-notifications?limit=50
GET /api/internal/scheduled-notifications?limit=50&tenantSlug=wondernails
Authorization: Bearer {SCHEDULED_NOTIFICATIONS_API_KEY}
```

`tenantSlug` (opcional): limita el poll a un tenant — útil si hay workflows n8n separados por negocio.

**Respuesta 200:**

```json
{
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "channel": "whatsapp",
      "status": "pending",
      "scheduledAt": "2026-05-16T20:00:00.000Z",
      "recipientPhone": "525551234567",
      "recipientName": "María",
      "body": "Hola María, te escribimos de Wonder Nails...",
      "templateKey": "booking_reschedule",
      "bookingId": "uuid",
      "payload": {
        "tenantSlug": "wondernails",
        "waLink": "https://wa.me/525551234567?text=...",
        "previousStartIso": "...",
        "newStartIso": "...",
        "serviceName": "Gel Manicure"
      }
    }
  ],
  "meta": { "count": 1, "polledAt": "2026-05-16T20:05:00.000Z" }
}
```

---

### 4.2 Marcar en procesamiento

Llamar **antes** de enviar WhatsApp (bloqueo optimista).

```http
PATCH /api/internal/scheduled-notifications/{id}
Authorization: Bearer {SCHEDULED_NOTIFICATIONS_API_KEY}
Content-Type: application/json

{
  "action": "processing"
}
```

Incrementa `attempts` y pone `processed_at`.

---

### 4.3 Marcar enviada

```http
PATCH /api/internal/scheduled-notifications/{id}
Content-Type: application/json

{
  "action": "sent",
  "externalMessageId": "wamid.xxx"
}
```

`externalMessageId`: ID del mensaje en la respuesta de Meta Graph API (`messages[0].id`).

---

### 4.4 Marcar fallida

```http
PATCH /api/internal/scheduled-notifications/{id}
Content-Type: application/json

{
  "action": "failed",
  "lastError": "WhatsApp API 131026: message undeliverable"
}
```

---

## 5. Payload por plantilla

### `template_key = booking_reschedule`

Encolado desde:

- `PATCH /api/tenants/{tenantSlug}/bookings/{id}` con `startTime` + `endTime` cuando cambia el horario.
- Código: `apps/web/lib/notifications/booking-reschedule-notification.ts`

**`payload` típico:**

```json
{
  "tenantSlug": "wondernails",
  "waLink": "https://wa.me/521234567890?text=...",
  "previousStartIso": "2026-05-16T21:00:00.000Z",
  "newStartIso": "2026-05-16T22:00:00.000Z",
  "serviceName": "Gel Manicure"
}
```

- **`body`**: texto listo para enviar por WhatsApp (español MX).
- **`waLink`**: enlace `wa.me` de respaldo (abrir manualmente); n8n puede ignorarlo si usa Cloud API.

**`idempotency_key`:**

```
booking_reschedule:{bookingId}:{newStartIso}
```

Si el admin guarda dos veces el mismo horario, no se duplica la fila.

---

## 6. Envío WhatsApp (n8n)

### Opción A — WhatsApp Cloud API (recomendada)

La app ya tiene cliente de referencia en `apps/web/lib/whatsapp.ts`:

```http
POST https://graph.facebook.com/v18.0/{WHATSAPP_PHONE_NUMBER_ID}/messages
Authorization: Bearer {WHATSAPP_ACCESS_TOKEN}
Content-Type: application/json

{
  "messaging_product": "whatsapp",
  "to": "525551234567",
  "type": "text",
  "text": { "body": "<contenido de scheduled_notifications.body>" }
}
```

Variables en servidor (compartir con n8n vía credenciales):

- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`

**Nodo n8n sugerido:** HTTP Request → usar `{{ $json.recipientPhone }}` y `{{ $json.body }}`.

### Opción B — Solo abrir wa.me (no automatizado)

Usar `payload.waLink` — no recomendado para producción; la app ya no abre el navegador al reprogramar.

---

## 7. Workflow n8n (esqueleto)

**Trigger:** Schedule cada 1–2 minutos (o Webhook si más adelante se expone push).

**Pasos:**

1. **HTTP Request** — `GET /api/internal/scheduled-notifications?limit=20`
2. **IF** — `meta.count > 0`
3. **Split In Batches** — por cada item en `data`
4. **HTTP Request** — `PATCH .../{id}` con `{ "action": "processing" }`
5. **HTTP Request** — POST Graph API WhatsApp con `body` y `recipientPhone`
6. **IF** — éxito HTTP 200
   - **Sí:** `PATCH` `{ "action": "sent", "externalMessageId": "..." }`
   - **No:** `PATCH` `{ "action": "failed", "lastError": "..." }`
7. (Opcional) Insert en `whatsapp_messages` para historial.

**Manejo de errores:**

- Si `processing` queda colgado >15 min, considerar job de limpieza que vuelva a `pending` o marque `failed`.
- Rate limits Meta: espaciar envíos (Wait node 200–500 ms entre mensajes).

---

## 8. Cómo dispara la app una notificación hoy

1. Admin en `/t/{tenant}/admin/calendar` arrastra una cita a nuevo horario.
2. Confirma en el diálogo.
3. Frontend: `PATCH /api/tenants/{tenant}/bookings/{id}` con `startTime`, `endTime`.
4. Backend:
   - Actualiza `bookings`.
   - Si cambió `startTime` y hay teléfono → `enqueueBookingRescheduleNotification()`.
5. Respuesta incluye `scheduledNotification` (fila creada o existente por idempotencia).

**Sin teléfono:** no se encola; el calendario muestra toast indicándolo.

---

## 9. Archivos de código relevantes

| Archivo                                                           | Rol                              |
| ----------------------------------------------------------------- | -------------------------------- |
| `packages/database/migrations/0017_scheduled_notifications.sql`   | DDL                              |
| `packages/database/schema.ts`                                     | Drizzle `scheduledNotifications` |
| `apps/web/lib/notifications/scheduled-notification-queue.ts`      | Encolar / listar / actualizar    |
| `apps/web/lib/notifications/booking-reschedule-notification.ts`   | Plantilla reprogramación         |
| `apps/web/lib/notifications/internal-api-auth.ts`                 | Auth Bearer                      |
| `apps/web/app/api/internal/scheduled-notifications/route.ts`      | GET poll                         |
| `apps/web/app/api/internal/scheduled-notifications/[id]/route.ts` | PATCH estado                     |
| `apps/web/app/api/tenants/[tenant]/bookings/[id]/route.ts`        | PATCH booking + encola           |
| `apps/web/lib/whatsapp.ts`                                        | Referencia Cloud API             |

---

## 10. Checklist de puesta en marcha

- [ ] Migración `0017` aplicada en Neon/Postgres.
- [ ] `SCHEDULED_NOTIFICATIONS_API_KEY` en `apps/web/.env.local` **y la misma clave** en credenciales n8n (Header Auth `Bearer …`).
- [ ] Tras cambiar la key, reiniciar `npm run dev` para que Next cargue el env.
- [ ] `WHATSAPP_PHONE_NUMBER_ID` y `WHATSAPP_ACCESS_TOKEN` configurados (n8n + app si aplica).
- [ ] Workflow n8n creado y activado.
- [ ] Prueba: reprogramar cita en calendario → ver fila `pending` en BD → n8n la pasa a `sent`.
- [ ] Verificar que el cliente recibe el WhatsApp.

---

## 11. Prueba manual rápida (curl)

```bash
# 1. Listar (tras encolar desde UI)
curl -s -H "Authorization: Bearer $SCHEDULED_NOTIFICATIONS_API_KEY" \
  "http://localhost:3003/api/internal/scheduled-notifications" | jq

# 2. Marcar processing
curl -s -X PATCH -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"action":"processing"}' \
  "http://localhost:3001/api/internal/scheduled-notifications/{ID}"

# 3. Marcar sent
curl -s -X PATCH -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"action":"sent","externalMessageId":"wamid.test"}' \
  "http://localhost:3001/api/internal/scheduled-notifications/{ID}"
```

---

## 12. Extensiones futuras (fuera de alcance actual)

| Plantilla              | Trigger app                                  |
| ---------------------- | -------------------------------------------- |
| `booking_confirmation` | POST booking público                         |
| `booking_reminder_24h` | Cron que inserta `scheduled_at = cita - 24h` |
| `booking_cancelled`    | PATCH status → cancelled                     |

Mismo patrón: encolar con `template_key` + `payload`; n8n ramifica por `template_key` si hace falta.

---

## 13. Contacto / dudas técnicas

- Repo: `sass-store` monorepo, app en `apps/web` (dev suele usar puerto **3003** si `PORT=3003` en `.env.local`).
- Multitenant: ver **§1.1**; poll global o `?tenantSlug=`; cada fila incluye `tenantId` + `payload.tenantSlug`.
- RLS: la tabla tiene políticas por `tenant_id`; la API interna usa conexión de servidor (bypass RLS según rol de `DATABASE_URL`).

---

_Última actualización: 2026-05-16 — alineado con implementación en rama actual._
