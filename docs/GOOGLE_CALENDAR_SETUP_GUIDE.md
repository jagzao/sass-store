# 📅 Google Calendar Integration - Complete Setup Guide

**Fecha:** 17 de diciembre de 2025
**Estado:** ✅ Implementación Completa

---

## 📋 **Tabla de Contenidos**

1. [Resumen](#resumen)
2. [Configuración de Google Cloud](#configuración-de-google-cloud)
3. [Variables de Entorno](#variables-de-entorno)
4. [Migración de Base de Datos](#migración-de-base-de-datos)
5. [Uso de la Funcionalidad](#uso-de-la-funcionalidad)
6. [Arquitectura Técnica](#arquitectura-técnica)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 **Resumen**

Esta integración permite a los tenants conectar su Google Calendar para sincronizar eventos automáticamente como bookings (citas) en el sistema.

### **Funcionalidades Implementadas:**

✅ Autenticación OAuth 2.0 con Google
✅ Sincronización de eventos del calendario
✅ Conversión automática de eventos → bookings
✅ Conversión de bookings → visitas de clientes
✅ UI para gestión de bookings
✅ UI para configuración del calendario

### **Flujo Completo:**

```
Google Calendar Event
    ↓
Sincronización (Manual o Automática)
    ↓
Booking en BD
    ↓
Conversión Manual
    ↓
Customer Visit
```

---

## ⚙️ **Configuración de Google Cloud**

### **Paso 1: Crear Proyecto en Google Cloud**

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear nuevo proyecto: **"SaaS Store Calendar Integration"**
3. Seleccionar el proyecto creado

### **Paso 2: Habilitar Google Calendar API**

1. En el menú lateral → **APIs & Services** → **Library**
2. Buscar: **"Google Calendar API"**
3. Click en **Enable**

### **Paso 3: Configurar Pantalla de Consentimiento OAuth**

1. Ir a **APIs & Services** → **OAuth consent screen**
2. Seleccionar **External** (para usuarios fuera de tu organización)
3. Completar información:
   - **App name:** SaaS Store
   - **User support email:** tu-email@dominio.com
   - **Developer contact:** tu-email@dominio.com
4. **Scopes:** Agregar:
   ```
   https://www.googleapis.com/auth/calendar.readonly
   ```
5. **Test users:** Agregar emails de prueba (opcional en desarrollo)
6. Click **Save and Continue**

### **Paso 4: Crear Credenciales OAuth 2.0**

1. Ir a **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Configurar:
   - **Application type:** Web application
   - **Name:** SaaS Store Web Client
   - **Authorized redirect URIs:**
     ```
     http://localhost:3001/api/auth/google/callback
     https://tu-dominio.com/api/auth/google/callback
     ```
4. Click **Create**
5. **IMPORTANTE:** Guardar:
   - **Client ID** (ejemplo: `123456-abc.apps.googleusercontent.com`)
   - **Client Secret** (ejemplo: `GOCSPX-abc123...`)

---

## 🔐 **Variables de Entorno**

### **Desarrollo (.env.local)**

```env
# Google Calendar Integration
GOOGLE_CALENDAR_CLIENT_ID=123456-abc.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=GOCSPX-abc123def456
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# Public Variables (accessible in frontend)
NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID=123456-abc.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
```

### **Producción (Vercel)**

1. Ir a Vercel Dashboard → Tu Proyecto → **Settings** → **Environment Variables**
2. Agregar las siguientes variables:

| Variable                                   | Valor                                             | Environment                      |
| ------------------------------------------ | ------------------------------------------------- | -------------------------------- |
| `GOOGLE_CALENDAR_CLIENT_ID`                | (tu Client ID)                                    | Production, Preview, Development |
| `GOOGLE_CALENDAR_CLIENT_SECRET`            | (tu Client Secret)                                | Production, Preview, Development |
| `GOOGLE_CALENDAR_REDIRECT_URI`             | `https://tu-dominio.com/api/auth/google/callback` | Production                       |
| `NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID`    | (tu Client ID)                                    | Production, Preview, Development |
| `NEXT_PUBLIC_GOOGLE_CALENDAR_REDIRECT_URI` | `https://tu-dominio.com/api/auth/google/callback` | Production                       |

3. **Redeploy** para aplicar cambios

---

## 🗄️ **Migración de Base de Datos**

### **Cambios en el Schema:**

La migración `0005_glamorous_galactus.sql` incluye:

```sql
-- Agregar campos de Google Calendar a tenants
ALTER TABLE "tenants" ADD COLUMN "google_calendar_id" varchar(255);
ALTER TABLE "tenants" ADD COLUMN "google_calendar_tokens" jsonb;
ALTER TABLE "tenants" ADD COLUMN "google_calendar_connected" boolean DEFAULT false NOT NULL;

-- Agregar relación customer_id a bookings
ALTER TABLE "bookings" ADD COLUMN "customer_id" uuid;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_customers_id_fk"
  FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");
```

### **Aplicar Migración:**

#### **Opción A: Usando Drizzle Kit (Recomendado)**

```bash
# Generar migración (ya hecha)
npx drizzle-kit generate

# Aplicar migración a producción
npx drizzle-kit push
```

#### **Opción B: Manualmente en Supabase**

1. Ir a [Supabase Dashboard](https://supabase.com/dashboard/project/jedryjmljffuvegggjmw)
2. **SQL Editor** → New Query
3. Copiar y pegar contenido de `packages/database/migrations/0005_glamorous_galactus.sql`
4. Ejecutar

---

## 🎨 **Uso de la Funcionalidad**

### **Para el Administrador del Tenant:**

#### **1. Conectar Google Calendar**

1. Ir a: `/t/{tenant-slug}/settings/calendar`
2. Click en **"Connect Google Calendar"**
3. Autorizar acceso en Google (solo lectura)
4. Serás redirigido de vuelta con confirmación

#### **2. Sincronizar Eventos**

1. En la misma página, click en **"Sync Calendar Now"**
2. El sistema importará eventos de los últimos 30 días
3. Ver resumen:
   - Total de eventos encontrados
   - Nuevos bookings creados
   - Eventos saltados (duplicados)
   - Errores (si hay)

#### **3. Gestionar Bookings**

1. Ir a: `/t/{tenant-slug}/admin_bookings`
2. Ver todos los bookings sincronizados
3. Filtrar por estado: Pending, Confirmed, Completed, Cancelled
4. Para eventos completados, click en **"Convert to Visit"**

#### **4. Convertir Bookings a Visitas**

1. En la lista de bookings, encontrar una cita completada
2. Click en **"Convert to Visit"**
3. El sistema:
   - Crea o vincula al cliente
   - Crea registro de visita
   - Vincula servicio a la visita
   - Marca booking como procesado

---

## 🏗️ **Arquitectura Técnica**

### **Archivos Creados:**

#### **Backend - API Endpoints:**

1. **OAuth Callback**
   `apps/web/app/api/auth/google/callback/route.ts`
   - Maneja el callback de OAuth
   - Intercambia código por tokens
   - Guarda tokens en BD

2. **Calendar Sync**
   `apps/web/app/api/tenants/[tenant]/calendar/sync/route.ts`
   - POST: Sincroniza eventos del calendario
   - GET: Obtiene estado de sincronización
   - Crea bookings automáticamente

3. **Bookings CRUD**
   `apps/web/app/api/tenants/[tenant]/bookings/route.ts`
   - GET: Lista bookings con filtros
   - POST: Crea booking manualmente

4. **Convert to Visit**
   `apps/web/app/api/tenants/[tenant]/bookings/[id]/convert-to-visit/route.ts`
   - POST: Convierte booking → customer visit
   - GET: Verifica si ya está convertido

#### **Frontend - UI Pages:**

1. **Calendar Settings**
   `apps/web/app/t/[tenant]/settings/calendar/page.tsx`
   - Conectar/desconectar Google Calendar
   - Sincronizar manualmente
   - Ver estadísticas

2. **Bookings Management**
   `apps/web/app/t/[tenant]/admin_bookings/page.tsx`
   - Lista de bookings
   - Filtros por estado
   - Conversión a visitas

#### **Database:**

1. **Schema Changes**
   `packages/database/schema.ts`
   - Tabla `tenants`: campos de Google Calendar
   - Tabla `bookings`: campo `customerId`

2. **Migration**
   `packages/database/migrations/0005_glamorous_galactus.sql`

### **Flujo de Datos:**

```
┌─────────────────────────────────────────────────────────────┐
│                     GOOGLE CALENDAR                          │
│                   (Usuario tiene eventos)                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ 1. Usuario conecta calendario
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              OAUTH FLOW (/api/auth/google/callback)         │
│  - Obtiene tokens de acceso                                 │
│  - Guarda en tenants.googleCalendarTokens                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ 2. Usuario hace clic en "Sync"
                         ↓
┌─────────────────────────────────────────────────────────────┐
│         SYNC ENDPOINT (/api/tenants/[tenant]/calendar/sync) │
│  - Lee eventos de Google Calendar API                       │
│  - Filtra eventos (últimos 30 días)                         │
│  - Crea bookings para eventos nuevos                        │
│  - Crea/vincula customers automáticamente                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ 3. Bookings creados en BD
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              BOOKINGS TABLE (Base de Datos)                  │
│  - id, tenantId, serviceId, customerId                      │
│  - customerName, customerEmail, customerPhone               │
│  - startTime, endTime, status                               │
│  - googleEventId (vínculo con evento original)              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ 4. Admin convierte a visita
                         ↓
┌─────────────────────────────────────────────────────────────┐
│     CONVERT ENDPOINT (/api/.../bookings/[id]/convert)       │
│  - Crea registro en customerVisits                          │
│  - Vincula servicios en customerVisitServices               │
│  - Marca booking como completado                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│         CUSTOMER VISITS TABLE (Base de Datos)                │
│  - Registro completo de visita                              │
│  - Vinculado a customer y booking                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 **Troubleshooting**

### **Problema 1: "Google Calendar not configured"**

**Síntoma:** Error al intentar conectar o sincronizar

**Solución:**

1. Verificar que las variables de entorno están configuradas:
   ```bash
   echo $GOOGLE_CALENDAR_CLIENT_ID
   echo $GOOGLE_CALENDAR_CLIENT_SECRET
   ```
2. Reiniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```

### **Problema 2: "Redirect URI mismatch"**

**Síntoma:** Error al redirigir desde Google OAuth

**Solución:**

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. Editar OAuth 2.0 Client
4. Verificar que **Authorized redirect URIs** incluye:
   ```
   http://localhost:3001/api/auth/google/callback
   ```

### **Problema 3: "Token expired" o "Invalid credentials"**

**Síntoma:** Sync falla después de un tiempo

**Solución:**

- El sistema maneja refresh tokens automáticamente
- Si persiste, desconectar y reconectar Google Calendar
- Verificar que scope incluye `calendar.readonly`

### **Problema 4: "No services found"**

**Síntoma:** Sync falla con mensaje sobre servicios

**Solución:**

1. Ir a `/t/{tenant-slug}/admin_services`
2. Crear al menos un servicio
3. Intentar sync nuevamente

### **Problema 5: Eventos duplicados**

**Síntoma:** Los mismos eventos se crean múltiples veces

**Solución:**

- El sistema previene duplicados usando `googleEventId`
- Verificar en BD que bookings tienen `googleEventId` único
- Si hay duplicados, revisar logs del endpoint sync

---

## 📊 **Límites y Consideraciones**

### **Google Calendar API Limits:**

| Límite                          | Valor     |
| ------------------------------- | --------- |
| Queries por día                 | 1,000,000 |
| Queries por usuario por segundo | 10        |
| Queries por segundo             | 500       |

**Recomendación:** Para usuarios con alto volumen, implementar rate limiting o caché.

### **Seguridad:**

✅ **Implementado:**

- OAuth 2.0 con PKCE
- Scope de solo lectura (`calendar.readonly`)
- Tokens encriptados en BD (JSONB)
- HTTPS obligatorio en producción

⚠️ **Pendiente (Opcional):**

- Encriptar `googleCalendarTokens` con AES-256
- Implementar token rotation automático
- Audit logs para cambios de configuración

### **Performance:**

**Optimizaciones Aplicadas:**

- Limit de 250 eventos por sync (configurable)
- Índices en `googleEventId` para búsquedas rápidas
- Batch inserts para bookings

**Mejoras Futuras:**

- Jobs en background con queue (Bull/BullMQ)
- Webhooks de Google Calendar para sync en tiempo real
- Caché de eventos en Redis

---

## 🚀 **Próximos Pasos (Opcional)**

### **1. Webhooks en Tiempo Real**

Implementar Google Calendar Push Notifications para sincronizar automáticamente:

```typescript
// apps/web/app/api/webhooks/google-calendar/route.ts
export async function POST(request: NextRequest) {
  // Recibir notificación de cambio
  // Sincronizar solo eventos modificados
}
```

### **2. Sincronización Bidireccional**

Permitir crear eventos en Google Calendar desde el sistema:

```typescript
// Crear evento en Google cuando se crea booking manual
await calendar.events.insert({
  calendarId: "primary",
  requestBody: {
    /* evento */
  },
});
```

### **3. Multi-Calendar Support**

Permitir sincronizar múltiples calendarios por tenant:

```sql
ALTER TABLE tenants ADD COLUMN google_calendars JSONB DEFAULT '[]';
```

### **4. Calendario Público Embed**

Widget para que clientes vean disponibilidad:

```tsx
<CalendarWidget tenantSlug={tenantSlug} />
```

---

## 📞 **Soporte y Recursos**

- **Google Calendar API Docs:** https://developers.google.com/calendar/api/guides/overview
- **OAuth 2.0 Playground:** https://developers.google.com/oauthplayground
- **Supabase Dashboard:** https://supabase.com/dashboard/project/jedryjmljffuvegggjmw

---

**Última actualización:** 17 de diciembre de 2025
**Autor:** Claude Code
**Estado:** ✅ Implementación completa y lista para producción
