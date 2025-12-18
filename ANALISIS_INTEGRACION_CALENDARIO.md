# 📅 Análisis: Integración de Calendario para Sincronización Automática de Visitas

**Fecha:** 17 de diciembre de 2025
**Objetivo:** Conectarse a los datos del calendario del tenant para cargar visitas de clientas automáticamente

---

## 🔍 **Infraestructura Actual Detectada**

### ✅ **Lo que YA existe en la base de datos:**

#### **1. Tabla `tenants` (schema.ts:183)**

```typescript
googleCalendarId: varchar("google_calendar_id", { length: 255 });
```

- **Propósito:** Almacenar ID del calendario de Google de cada tenant
- **Estado:** ✅ Campo existe, probablemente vacío
- **Uso:** Identificar qué calendario sincronizar

#### **2. Tabla `bookings` (schema.ts:196-227)**

```typescript
{
  id: uuid("id"),
  tenantId: uuid("tenant_id"),
  serviceId: uuid("service_id"),
  staffId: uuid("staff_id"),
  customerName: varchar("customer_name", { length: 100 }),
  customerEmail: varchar("customer_email", { length: 255 }),
  customerPhone: varchar("customer_phone", { length: 20 }),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  status: varchar("status", { length: 20 }), // pending, confirmed, completed, cancelled
  notes: text("notes"),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }),
  googleEventId: varchar("google_event_id", { length: 255 }), // ⭐ CLAVE
  metadata: jsonb("metadata"),
}
```

- **Propósito:** Almacenar citas/reservas
- **Estado:** ✅ Tabla existe con campo `googleEventId`
- **Uso:** Vincular citas locales con eventos de Google Calendar

#### **3. Tabla `customerVisits` (schema.ts:1363-1498)**

```typescript
{
  appointmentId: uuid("appointment_id").references(() => bookings.id),
  // ... otros campos de la visita
}
```

- **Propósito:** Registrar visitas completadas de clientes
- **Estado:** ✅ Relación con `bookings` existe
- **Uso:** Convertir cita (booking) → visita completada

#### **4. API Endpoint Existente:**

`apps/web/app/api/tenants/[tenant]/customers/[id]/visits/route.ts`

- **GET:** Obtener visitas de un cliente
- **POST:** Crear nueva visita manualmente
- **Estado:** ✅ Funcional
- **Limitación:** Solo permite creación MANUAL

---

## ❌ **Lo que NO existe (falta implementar):**

### **1. Código de Integración con Google Calendar API**

- ❌ No hay llamadas a la API de Google Calendar
- ❌ No hay código para leer eventos del calendario
- ❌ No hay webhooks para sincronización automática

### **2. Autenticación OAuth 2.0**

- ❌ No hay variables de entorno para Google Calendar API:
  - `GOOGLE_CALENDAR_CLIENT_ID`
  - `GOOGLE_CALENDAR_CLIENT_SECRET`
  - `GOOGLE_CALENDAR_REDIRECT_URI`
- ❌ No hay flujo de autorización para que el tenant conecte su calendario

### **3. API Routes para Bookings**

- ❌ No existe `api/tenants/[tenant]/bookings/route.ts`
- ❌ No hay endpoints para crear/leer/actualizar bookings

### **4. Sincronización Automática**

- ❌ No hay webhooks de Google Calendar configurados
- ❌ No hay jobs/cron para sincronización periódica
- ❌ No hay lógica para convertir eventos de calendario → bookings → visitas

---

## 🎯 **Opciones de Implementación**

### **Opción 1: Google Calendar API con OAuth 2.0 (RECOMENDADA)**

#### **✅ Ventajas:**

- Acceso directo a datos del calendario
- Sincronización en tiempo real con webhooks
- Control total sobre la sincronización
- Gratis hasta 1M de llamadas/día

#### **❌ Desventajas:**

- Requiere configuración OAuth compleja
- Cada tenant debe autorizar acceso a su calendario
- Mantenimiento de tokens de acceso

#### **📋 Pasos de Implementación:**

**1. Configurar Google Cloud Project**

```bash
# 1. Ir a: https://console.cloud.google.com/
# 2. Crear proyecto "SaaS Store Calendar Sync"
# 3. Habilitar Google Calendar API
# 4. Crear credenciales OAuth 2.0
# 5. Configurar pantalla de consentimiento
```

**2. Agregar variables de entorno**

```env
# .env
GOOGLE_CALENDAR_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CALENDAR_CLIENT_SECRET="GOCSPX-xxx"
GOOGLE_CALENDAR_REDIRECT_URI="https://tu-dominio.com/api/auth/google/callback"
```

**3. Implementar flujo OAuth en el admin panel**

```typescript
// apps/web/app/t/[tenant]/settings/calendar/page.tsx
export default function CalendarSettings() {
  const handleConnectCalendar = async () => {
    // Redirigir a OAuth de Google
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?
      client_id=${process.env.GOOGLE_CALENDAR_CLIENT_ID}&
      redirect_uri=${process.env.GOOGLE_CALENDAR_REDIRECT_URI}&
      response_type=code&
      scope=https://www.googleapis.com/auth/calendar.readonly&
      access_type=offline&
      state=${tenantId}`;

    window.location.href = authUrl;
  };

  return (
    <button onClick={handleConnectCalendar}>
      Conectar Google Calendar
    </button>
  );
}
```

**4. Crear endpoint de callback OAuth**

```typescript
// apps/web/app/api/auth/google/callback/route.ts
import { google } from "googleapis";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tenantId = searchParams.get("state");

  // Intercambiar código por tokens
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    process.env.GOOGLE_CALENDAR_REDIRECT_URI,
  );

  const { tokens } = await oauth2Client.getToken(code);

  // Guardar tokens en BD
  await db
    .update(tenants)
    .set({
      googleCalendarTokens: tokens, // Nuevo campo JSONB
      googleCalendarConnected: true,
    })
    .where(eq(tenants.id, tenantId));

  return NextResponse.redirect("/settings/calendar?success=true");
}
```

**5. Crear endpoint de sincronización**

```typescript
// apps/web/app/api/tenants/[tenant]/calendar/sync/route.ts
import { google } from "googleapis";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  const { tenant: tenantSlug } = await params;

  // Obtener tenant y tokens
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);

  if (!tenant.googleCalendarTokens) {
    return NextResponse.json(
      { error: "Calendar not connected" },
      { status: 400 },
    );
  }

  // Configurar cliente OAuth
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials(tenant.googleCalendarTokens);

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  // Obtener eventos de los últimos 30 días
  const events = await calendar.events.list({
    calendarId: tenant.googleCalendarId || "primary",
    timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    timeMax: new Date().toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  // Procesar eventos y crear bookings
  const syncedBookings = [];
  for (const event of events.data.items || []) {
    // Verificar si el evento ya existe
    const existing = await db
      .select()
      .from(bookings)
      .where(eq(bookings.googleEventId, event.id))
      .limit(1);

    if (existing.length > 0) continue; // Ya existe

    // Extraer datos del evento
    const customerName = event.summary || "Sin nombre";
    const customerEmail = event.attendees?.[0]?.email;
    const startTime = new Date(event.start?.dateTime || event.start?.date);
    const endTime = new Date(event.end?.dateTime || event.end?.date);

    // Crear booking
    const [booking] = await db
      .insert(bookings)
      .values({
        tenantId: tenant.id,
        serviceId: null, // Requiere mapeo manual
        customerName,
        customerEmail,
        startTime,
        endTime,
        status: "completed", // Asumimos que eventos pasados están completados
        googleEventId: event.id,
        notes: event.description,
        totalPrice: "0", // Requiere configuración manual
      })
      .returning();

    syncedBookings.push(booking);
  }

  return NextResponse.json({
    success: true,
    syncedCount: syncedBookings.length,
    bookings: syncedBookings,
  });
}
```

**6. Convertir bookings → customerVisits automáticamente**

```typescript
// apps/web/app/api/tenants/[tenant]/bookings/[id]/convert-to-visit/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> },
) {
  const { tenant: tenantSlug, id: bookingId } = await params;

  // Obtener booking
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Buscar o crear cliente
  let customer = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.email, booking.customerEmail),
        eq(customers.tenantId, booking.tenantId),
      ),
    )
    .limit(1);

  if (customer.length === 0) {
    // Crear cliente nuevo
    [customer] = await db
      .insert(customers)
      .values({
        tenantId: booking.tenantId,
        name: booking.customerName,
        email: booking.customerEmail,
        phone: booking.customerPhone,
      })
      .returning();
  }

  // Crear visita
  const [visit] = await db
    .insert(customerVisits)
    .values({
      tenantId: booking.tenantId,
      customerId: customer[0].id,
      appointmentId: booking.id,
      visitDate: booking.startTime,
      totalAmount: booking.totalPrice,
      status: "completed",
      notes: booking.notes,
    })
    .returning();

  return NextResponse.json({ success: true, visit });
}
```

**7. Configurar Webhooks de Google Calendar (Opcional - Tiempo Real)**

```typescript
// apps/web/app/api/webhooks/google-calendar/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Google Calendar envía notificaciones cuando hay cambios
  // Procesar el evento y sincronizar

  return NextResponse.json({ received: true });
}

// Registrar webhook en Google Calendar
async function setupWebhook(tenantId: string) {
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  await calendar.events.watch({
    calendarId: "primary",
    requestBody: {
      id: `tenant-${tenantId}`,
      type: "web_hook",
      address: "https://tu-dominio.com/api/webhooks/google-calendar",
    },
  });
}
```

#### **📦 Dependencias a Instalar:**

```bash
npm install googleapis
npm install @types/googleapis -D
```

#### **⏱️ Estimación de Complejidad:**

- **Backend (OAuth + API):** 8-12 horas
- **Frontend (UI de conexión):** 3-4 horas
- **Webhooks (opcional):** 4-6 horas
- **Testing:** 3-4 horas
- **Total:** 18-26 horas

---

### **Opción 2: Importación Manual CSV/Excel**

#### **✅ Ventajas:**

- Implementación rápida (2-3 horas)
- No requiere OAuth
- Control total del usuario

#### **❌ Desventajas:**

- No es automático
- Requiere exportar datos manualmente
- Propenso a errores humanos

#### **📋 Pasos de Implementación:**

```typescript
// apps/web/app/t/[tenant]/admin_visits/import/page.tsx
export default function ImportVisits() {
  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`/api/tenants/${tenantSlug}/visits/import`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    console.log(`Importadas ${result.count} visitas`);
  };

  return (
    <div>
      <h1>Importar Visitas desde CSV</h1>
      <input type="file" accept=".csv,.xlsx" onChange={(e) => handleFileUpload(e.target.files[0])} />
    </div>
  );
}
```

---

### **Opción 3: Integración con Calendly/Acuity/Square Appointments**

#### **✅ Ventajas:**

- APIs más simples que Google Calendar
- Diseñadas específicamente para bookings
- Webhooks nativos

#### **❌ Desventajas:**

- Requiere que el tenant use esa plataforma
- Costo adicional para el tenant

---

## 🎯 **Recomendación Final**

### **Para MVP (corto plazo):**

**Opción 2: Importación Manual CSV**

- Rápido de implementar
- Permite al tenant cargar datos históricos
- Sin dependencias externas

### **Para Producción (largo plazo):**

**Opción 1: Google Calendar API con OAuth**

- Automatización real
- Experiencia de usuario superior
- Escalable

---

## 📋 **Plan de Acción Sugerido**

### **FASE 1: Habilitación Manual (1-2 días)**

1. Crear UI para importar CSV de visitas
2. Parsear CSV y crear registros en `customerVisits`
3. Validar datos antes de importar

### **FASE 2: Integración Google Calendar (1-2 semanas)**

1. Configurar Google Cloud Project
2. Implementar OAuth flow
3. Crear endpoint de sincronización
4. Crear UI en admin panel para conectar calendario
5. Testing exhaustivo

### **FASE 3: Automatización Completa (opcional)**

1. Configurar webhooks
2. Implementar sincronización bidireccional
3. Auto-crear visitas desde bookings completados

---

## ⚠️ **Consideraciones Importantes**

### **Seguridad:**

- Tokens de Google Calendar deben encriptarse en BD
- Usar HTTPS para OAuth callbacks
- Validar permisos de tenant antes de sincronizar

### **Privacidad:**

- Solicitar solo permisos `calendar.readonly` (no modificar calendario)
- Permitir al tenant desconectar en cualquier momento
- Cumplir con GDPR/CCPA para datos de clientes

### **Performance:**

- Sincronización incremental (solo eventos nuevos)
- Cachear resultados en Redis
- Jobs en background para sincronizaciones grandes

---

## 📞 **Próximos Pasos**

**¿Qué prefieres implementar primero?**

A. **Importación CSV** (2-3 horas) - Solución rápida
B. **Google Calendar OAuth** (18-26 horas) - Solución automática
C. **Ambas** - CSV para datos históricos + OAuth para futuro

**Si eliges B o C, necesitarás:**

1. Crear Google Cloud Project
2. Obtener credenciales OAuth
3. Configurar dominio autorizado para callbacks

---

**Última actualización:** 17 de diciembre de 2025
**Autor:** Claude Code
**Estado:** ✅ Análisis completo - Esperando decisión
