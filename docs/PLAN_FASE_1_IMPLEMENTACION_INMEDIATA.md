# Plan de Implementación Inmediata: Fase 1 - Mejoras Críticas

## Resumen Ejecutivo

Este documento detalla el plan de implementación inmediata para la Fase 1, que incluye las tres mejoras críticas que permitirán a SASS Store comenzar a superar a Fudo en el mercado. El plan está diseñado para ejecutarse en las próximas 4-6 semanas con un enfoque ágil y resultados rápidos.

## Objetivos de la Fase 1

### Objetivos Principales

1. **Sistema de Reservas Avanzado**: Implementar un sistema completo de reservas que sea una ventaja competitiva directa sobre Fudo.
2. **Modo Offline con Sincronización**: Desarrollar capacidad para operar sin conexión a internet, resolviendo una limitación crítica de Fudo.
3. **Integración con Mercado Pago**: Integrar el método de pago preferido en Latinoamérica para facilitar transacciones.

### Objetivos Secundarios

1. **Validación de Concepto**: Probar la viabilidad del enfoque y la capacidad del equipo para ejecutar el plan completo.
2. **Generación de Valor Temprano**: Proporcionar funcionalidades valiosas a los clientes lo antes posible.
3. **Momentum de Mercado**: Crear impulso y diferenciación competitiva en el corto plazo.

## Equipo de Implementación

### Estructura del Equipo

- **Product Manager**: 1 (Liderazgo de producto y coordinación)
- **Frontend Developers**: 2 (Desarrollo de componentes UI)
- **Backend Developers**: 2 (Desarrollo de APIs y lógica de negocio)
- **UI/UX Designer**: 1 (50% dedicación, diseño de interfaces)
- **QA Engineer**: 1 (Aseguramiento de calidad)

### Roles y Responsabilidades

#### Product Manager

- Definir requisitos y prioridades
- Coordinar entre equipos y stakeholders
- Gestionar backlog y sprint planning
- Asegurar alineación con objetivos de negocio

#### Frontend Developers

- Implementar componentes de UI
- Desarrollar experiencia de usuario
- Integrar con APIs del backend
- Optimizar rendimiento y accesibilidad

#### Backend Developers

- Diseñar e implementar modelo de datos
- Desarrollar APIs y servicios
- Implementar lógica de negocio
- Integrar con servicios externos (Mercado Pago, Google Calendar)

#### UI/UX Designer

- Diseñar interfaces de usuario
- Crear prototipos y flujos
- Asegurar consistencia visual
- Validar experiencia de usuario

#### QA Engineer

- Diseñar y ejecutar planes de prueba
- Identificar y documentar bugs
- Verificar cumplimiento de requisitos
- Asegurar calidad de producto

## Cronograma Detallado (4-6 Semanas)

### Semana 1: Planificación y Diseño

#### Día 1-2: Kickoff y Planificación

- [ ] **Kickoff del Proyecto**: Reunión con todo el equipo para presentar objetivos y alcance
- [ ] **Definición de Requisitos**: Detallar requisitos funcionales y no funcionales
- [ ] **Priorización de Funcionalidades**: Definir MVP para cada mejora
- [ ] **Asignación de Tareas**: Distribuir tareas iniciales entre el equipo

#### Día 3-4: Diseño de Arquitectura

- [ ] **Diseño de Arquitectura Técnica**: Definir estructura general del sistema
- [ ] **Diseño de Modelo de Datos**: Esquema de base de datos para las tres mejoras
- [ ] **Diseño de APIs**: Definir endpoints y contratos de API
- [ ] **Revisión de Arquitectura**: Validar diseño con equipo técnico

#### Día 5: Diseño de UI/UX

- [ ] **Diseño de Flujos de Usuario**: Mapas de flujo para cada funcionalidad
- [ ] **Creación de Wireframes**: Estructuras básicas de las interfaces
- [ ] **Diseño de Prototipos**: Prototipos interactivos para validación
- [ ] **Revisión de Diseño**: Validar diseños con stakeholders

### Semana 2: Desarrollo de Backend - Parte 1

#### Día 6-7: Modelo de Datos y APIs Básicas

- [ ] **Implementación de Modelo de Datos**: Crear tablas y relaciones en la base de datos
- [ ] **Desarrollo de APIs Básicas**: Implementar endpoints CRUD para reservas
- [ ] **Configuración de Autenticación**: Asegurar control de acceso a APIs
- [ ] **Pruebas Unitarias**: Verificar funcionamiento básico de APIs

#### Día 8-9: Lógica de Reservas

- [ ] **Desarrollo de Lógica de Reservas**: Algoritmos de disponibilidad y conflictos
- [ ] **Implementación de Reglas de Negocio**: Validaciones y restricciones
- [ ] **Integración con Google Calendar**: Conexión básica con API de Google
- [ ] **Pruebas de Integración**: Verificar integración entre componentes

#### Día 10: Servicios de Offline

- [ ] **Desarrollo de Servicio de Cola**: Implementar cola de operaciones pendientes
- [ ] **Creación de Servicio de Sincronización**: Lógica para sincronizar al restaurar conexión
- [ ] **Implementación de Detección de Conexión**: Servicio para verificar estado de conexión
- [ ] **Pruebas de Funcionalidad Offline**: Verificar comportamiento sin conexión

### Semana 3: Desarrollo de Frontend - Parte 1

#### Día 11-12: Componentes Básicos

- [ ] **Desarrollo de Componentes de UI**: Componentes reutilizables básicos
- [ ] **Implementación de Vistas**: Estructuras básicas de las pantallas
- [ ] **Integración con APIs**: Conexión de frontend con backend
- [ ] **Pruebas de Integración**: Verificar comunicación frontend-backend

#### Día 13-14: Interfaz de Reservas

- [ ] **Desarrollo de Calendario de Reservas**: Componente visual para selección de fechas
- [ ] **Implementación de Formulario de Reserva**: Captura de datos de reserva
- [ ] **Creación de Lista de Reservas**: Visualización de reservas existentes
- [ ] **Pruebas de Funcionalidad**: Verificar funcionamiento básico de reservas

#### Día 15: Componentes de Offline

- [ ] **Desarrollo de Notificador de Conexión**: Componente para mostrar estado de conexión
- [ ] **Implementación de Indicador Offline**: Visualización de modo offline
- [ ] **Creación de Cola Visual**: Interfaz para mostrar operaciones pendientes
- [ ] **Pruebas de Experiencia Offline**: Verificar experiencia de usuario sin conexión

### Semana 4: Desarrollo de Backend - Parte 2

#### Día 16-17: Integración con Mercado Pago

- [ ] **Configuración de Mercado Pago**: Crear cuenta y obtener credenciales
- [ ] **Desarrollo de Servicio de Pagos**: Implementar lógica de procesamiento de pagos
- [ ] **Creación de Webhooks**: Manejo de notificaciones de Mercado Pago
- [ ] **Pruebas de Integración**: Verificar integración con Mercado Pago en sandbox

#### Día 18-19: Funcionalidades Avanzadas de Reservas

- [ ] **Desarrollo de Recordatorios Automáticos**: Sistema de envío de recordatorios
- [ ] **Implementación de Gestión de Cancelaciones**: Lógica para manejar cancelaciones
- [ ] **Creación de Reportes de Reservas**: Generación de reportes básicos
- [ ] **Pruebas de Funcionalidades**: Verificar funcionamiento completo

#### Día 20: Optimización y Seguridad

- [ ] **Optimización de Rendimiento**: Mejorar velocidad de respuesta y consultas
- [ ] **Implementación de Seguridad**: Validación de inputs, prevención de ataques
- [ ] **Configuración de Logging**: Registro de operaciones y errores
- [ ] **Pruebas de Carga y Seguridad**: Verificar comportamiento bajo estrés

### Semana 5: Desarrollo de Frontend - Parte 2

#### Día 21-22: Integración con Mercado Pago

- [ ] **Desarrollo de Componentes de Pago**: Botones y formularios de pago
- [ ] **Implementación de Flujo de Pago**: Experiencia completa de pago
- [ ] **Creación de Confirmación de Pago**: Visualización de resultados de pago
- [ ] **Pruebas de Integración**: Verificar flujo completo de pago

#### Día 23-24: Funcionalidades Avanzadas de UI

- [ ] **Desarrollo de Dashboard de Reservas**: Vista administrativa de reservas
- [ ] **Implementación de Filtros y Búsqueda**: Capacidades de filtrado y búsqueda
- [ ] **Creación de Vista de Calendario**: Vista mensual/semanal de reservas
- [ ] **Pruebas de Funcionalidades**: Verificar funcionamiento completo

#### Día 25: Accesibilidad y UX

- [ ] **Implementación de Accesibilidad**: Atributos ARIA, contraste, navegación
- [ ] **Mejora de Experiencia de Usuario**: Microinteracciones, feedback visual
- [ ] **Optimización para Móvil**: Diseño responsivo y táctil
- [ ] **Pruebas de Accesibilidad y UX**: Verificar experiencia completa

### Semana 6: Integración, Testing y Lanzamiento

#### Día 26-27: Integración Completa

- [ ] **Integración de Todos los Componentes**: Unir frontend, backend y servicios
- [ ] **Pruebas End-to-End**: Verificar flujos completos del usuario
- [ ] **Pruebas de Compatibilidad**: Verificar funcionamiento en diferentes navegadores
- [ ] **Corrección de Bugs Críticos**: Resolver problemas identificados

#### Día 28-29: Testing de Aceptación

- [ ] **Pruebas Internas**: Equipo interno prueba todas las funcionalidades
- [ ] **Pruebas con Usuarios Beta**: Seleccionar clientes para pruebas beta
- [ ] **Recolección de Feedback**: Recopilar opiniones y sugerencias
- [ ] **Ajustes Finales**: Implementar mejoras basadas en feedback

#### Día 30: Preparación para Lanzamiento

- [ ] **Documentación**: Preparar documentación para usuarios y desarrolladores
- [ ] **Capacitación de Soporte**: Capacitar equipo de soporte en nuevas funcionalidades
- [ ] **Preparación de Entorno**: Configurar entorno de producción
- [ ] **Plan de Lanzamiento**: Definir estrategia de lanzamiento

## Implementación Técnica Detallada

### 1. Sistema de Reservas Avanzado

#### Modelo de Datos

```sql
-- Tabla de reservas
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  customer_id UUID REFERENCES customers(id),
  service_id UUID NOT NULL REFERENCES services(id),
  staff_id UUID REFERENCES staff(id),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Políticas de RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON bookings
    FOR ALL TO application_role
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

#### API Endpoints

```typescript
// apps/api/app/api/bookings/route.ts
export async function GET(request: Request) {
  // Listar reservas con filtros
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");
  const date = searchParams.get("date");
  const serviceId = searchParams.get("serviceId");

  const bookings = await db.query.bookings.findMany({
    where: and(
      eq(bookings.tenantId, tenantId),
      date ? eq(bookings.startTime, date) : undefined,
      serviceId ? eq(bookings.serviceId, serviceId) : undefined,
    ),
    with: {
      customer: true,
      service: true,
      staff: true,
    },
    orderBy: [asc(bookings.startTime)],
  });

  return Response.json({ bookings });
}

export async function POST(request: Request) {
  // Crear nueva reserva
  const bookingData = await request.json();

  // Verificar disponibilidad
  const conflictingBooking = await db.query.bookings.findFirst({
    where: and(
      eq(bookings.tenantId, bookingData.tenantId),
      eq(bookings.staffId, bookingData.staffId),
      or(
        and(
          lte(bookings.startTime, bookingData.startTime),
          gt(bookings.endTime, bookingData.startTime),
        ),
        and(
          lt(bookings.startTime, bookingData.endTime),
          gte(bookings.endTime, bookingData.endTime),
        ),
      ),
    ),
  });

  if (conflictingBooking) {
    return Response.json({ error: "Conflicting booking" }, { status: 400 });
  }

  // Crear reserva
  const newBooking = await db.insert(bookings).values(bookingData).returning();

  // Programar recordatorio
  await scheduleReminder(newBooking.id);

  return Response.json({ booking: newBooking });
}
```

#### Componentes de UI

```typescript
// apps/web/components/booking/BookingCalendar.tsx
interface BookingCalendarProps {
  tenantId: string;
  services: Service[];
  staff: Staff[];
  onSlotSelect: (slot: TimeSlot) => void;
}

export function BookingCalendar({
  tenantId,
  services,
  staff,
  onSlotSelect
}: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      const response = await fetch(`/api/bookings?tenantId=${tenantId}&date=${selectedDate.toISOString()}`);
      const data = await response.json();
      setBookings(data.bookings);
      setLoading(false);
    };

    fetchBookings();
  }, [tenantId, selectedDate]);

  const handleSlotSelect = (slot: TimeSlot) => {
    onSlotSelect(slot);
  };

  if (loading) return <div>Cargando calendario...</div>;

  return (
    <div className="booking-calendar">
      <div className="calendar-header">
        <h2>Selecciona una fecha y hora</h2>
        <DatePicker
          value={selectedDate}
          onChange={setSelectedDate}
          minDate={new Date()}
        />
      </div>

      <div className="time-slots">
        {generateTimeSlots(selectedDate).map((slot) => (
          <TimeSlot
            key={slot.id}
            slot={slot}
            bookings={bookings}
            staff={staff}
            onSelect={handleSlotSelect}
          />
        ))}
      </div>
    </div>
  );
}
```

### 2. Modo Offline con Sincronización

#### Service Worker

```javascript
// public/sw.js
const CACHE_NAME = "sass-store-v1";
const OFFLINE_URL = "/offline";

// Instalación del Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll([
          "/",
          "/offline",
          "/static/js/bundle.js",
          "/static/css/main.css",
        ]),
      ),
  );
});

// Interceptar peticiones
self.addEventListener("fetch", (event) => {
  if (event.request.method === "GET") {
    event.respondWith(
      caches
        .match(event.request)
        .then((response) => {
          // Devolver desde caché si está disponible
          if (response) {
            return response;
          }

          return fetch(event.request).then((response) => {
            // Almacenar en caché para futuras peticiones
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          });
        })
        .catch(() => {
          // Devolver página offline si no hay conexión
          return caches.match(OFFLINE_URL);
        }),
    );
  } else {
    // Manejar peticiones POST/PUT/DELETE cuando está offline
    event.respondWith(
      fetch(event.request).catch(() => {
        // Almacenar en IndexedDB para sincronizar después
        return storeOfflineRequest(event.request);
      }),
    );
  }
});

// Sincronizar cuando se restaura la conexión
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-offline-requests") {
    event.waitUntil(syncOfflineRequests());
  }
});

// Función para sincronizar peticiones offline
async function syncOfflineRequests() {
  const requests = await getOfflineRequests();

  for (const request of requests) {
    try {
      await fetch(request);
      await removeOfflineRequest(request.id);
    } catch (error) {
      console.error("Error syncing request:", error);
    }
  }
}
```

#### Cola de Operaciones Offline

```typescript
// apps/web/lib/offline-queue.ts
export class OfflineQueue {
  private static instance: OfflineQueue;
  private queue: Operation[] = [];

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): OfflineQueue {
    if (!OfflineQueue.instance) {
      OfflineQueue.instance = new OfflineQueue();
    }
    return OfflineQueue.instance;
  }

  async add(operation: Operation) {
    const id = generateId();
    const timestamp = new Date().toISOString();

    const newOperation: Operation = {
      id,
      timestamp,
      ...operation,
    };

    this.queue.push(newOperation);
    await this.saveToStorage();

    // Si hay conexión, intentar procesar inmediatamente
    if (navigator.onLine) {
      this.processAll();
    }
  }

  async processAll() {
    if (!navigator.onLine) return;

    const processed: string[] = [];

    for (const operation of this.queue) {
      try {
        await this.processOperation(operation);
        processed.push(operation.id);
      } catch (error) {
        console.error("Error processing operation:", error);
      }
    }

    // Eliminar operaciones procesadas
    this.queue = this.queue.filter((op) => !processed.includes(op.id));
    await this.saveToStorage();
  }

  private async processOperation(operation: Operation) {
    switch (operation.type) {
      case "CREATE_BOOKING":
        await this.createBooking(operation.data);
        break;
      case "UPDATE_BOOKING":
        await this.updateBooking(operation.id, operation.data);
        break;
      case "DELETE_BOOKING":
        await this.deleteBooking(operation.id);
        break;
      // otros tipos de operaciones
    }
  }

  private async createBooking(data: any) {
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to create booking");
    }

    return response.json();
  }

  private async saveToStorage() {
    localStorage.setItem("offlineQueue", JSON.stringify(this.queue));
  }

  private async loadFromStorage() {
    const stored = localStorage.getItem("offlineQueue");
    if (stored) {
      this.queue = JSON.parse(stored);
    }
  }
}
```

#### Componente de Estado de Conexión

```typescript
// apps/web/components/ui/ConnectionStatus.tsx
interface ConnectionStatusProps {
  onStatusChange: (isOnline: boolean) => void;
}

export function ConnectionStatus({ onStatusChange }: ConnectionStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineOperations, setOfflineOperations] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      onStatusChange(true);
      // Sincronizar operaciones pendientes
      OfflineQueue.getInstance().processAll();
    };

    const handleOffline = () => {
      setIsOnline(false);
      onStatusChange(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Suscribirse a cambios en la cola offline
    const queue = OfflineQueue.getInstance();
    const updateOfflineCount = () => {
      setOfflineOperations(queue.getQueueLength());
    };

    // Actualizar contador de operaciones offline
    const interval = setInterval(updateOfflineCount, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [onStatusChange]);

  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg transition-all ${
      isOnline ? 'bg-green-500' : 'bg-red-500'
    } text-white`}>
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-200' : 'bg-red-200'}`}></div>
        <span>{isOnline ? 'Conectado' : 'Sin conexión'}</span>
        {!isOnline && offlineOperations > 0 && (
          <span className="ml-2 bg-red-700 px-2 py-1 rounded text-xs">
            {offlineOperations} pendientes
          </span>
        )}
      </div>
    </div>
  );
}
```

### 3. Integración con Mercado Pago

#### Servicio de Pagos

```typescript
// apps/api/lib/mercadopago.ts
import { MercadoPagoConfig, Payment } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

export const payment = new Payment(client);

export class MercadoPagoService {
  async createPayment(paymentData: PaymentData) {
    try {
      const payment = await payment.create({
        transaction_amount: paymentData.amount,
        description: paymentData.description,
        payment_method_id: paymentData.paymentMethodId,
        payer: {
          email: paymentData.payerEmail,
        },
        metadata: {
          tenant_id: paymentData.tenantId,
          booking_id: paymentData.bookingId,
        },
        external_reference: paymentData.externalReference,
        notification_url: `${process.env.BASE_URL}/api/payments/mercadopago/webhook`,
      });

      return {
        success: true,
        payment: {
          id: payment.id,
          status: payment.status,
          status_detail: payment.status_detail,
          init_point: payment.init_point,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async handleWebhook(webhookData: any) {
    try {
      // Verificar que el webhook es legítimo
      if (!this.verifyWebhook(webhookData)) {
        return { success: false, error: "Invalid webhook" };
      }

      // Procesar según el tipo de notificación
      switch (webhookData.type) {
        case "payment":
          return await this.processPayment(webhookData.data);
        default:
          return { success: false, error: "Unsupported webhook type" };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private verifyWebhook(webhookData: any): boolean {
    // Implementar verificación de webhook
    // Por ejemplo, verificar firma o token secreto
    return true;
  }

  private async processPayment(paymentData: any) {
    // Actualizar estado del pago en la base de datos
    const paymentId = paymentData.id;
    const status = paymentData.status;

    // Obtener información del pago desde Mercado Pago
    const paymentInfo = await payment.get({ id: paymentId });

    // Actualizar registro de pago en la base de datos
    await db
      .update(payments)
      .set({
        status: status,
        providerTransactionId: paymentId,
        metadata: paymentInfo,
      })
      .where(eq(payments.externalReference, paymentInfo.external_reference));

    // Si el pago fue aprobado, actualizar estado de la reserva
    if (status === "approved") {
      const bookingId = paymentInfo.metadata.booking_id;
      await db
        .update(bookings)
        .set({ status: "confirmed" })
        .where(eq(bookings.id, bookingId));
    }

    return { success: true };
  }
}
```

#### API Endpoints para Pagos

```typescript
// apps/api/app/api/payments/mercadopago/route.ts
export async function POST(request: Request) {
  const paymentData = await request.json();

  // Validar datos de pago
  const validatedData = paymentSchema.parse(paymentData);

  // Crear pago en Mercado Pago
  const mercadoPagoService = new MercadoPagoService();
  const result = await mercadoPagoService.createPayment(validatedData);

  if (!result.success) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  // Guardar información del pago en la base de datos
  await db.insert(payments).values({
    tenantId: validatedData.tenantId,
    bookingId: validatedData.bookingId,
    amount: validatedData.amount,
    method: "mercadopago",
    provider: "mercadopago",
    providerTransactionId: result.payment.id,
    status: result.payment.status,
    externalReference: validatedData.externalReference,
  });

  return Response.json({ payment: result.payment });
}

// apps/api/app/api/payments/mercadopago/webhook/route.ts
export async function POST(request: Request) {
  const webhookData = await request.json();

  // Procesar webhook
  const mercadoPagoService = new MercadoPagoService();
  const result = await mercadoPagoService.handleWebhook(webhookData);

  if (!result.success) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json({ success: true });
}
```

#### Componentes de Pago

```typescript
// apps/web/components/payments/MercadoPagoButton.tsx
interface MercadoPagoButtonProps {
  amount: number;
  description: string;
  tenantId: string;
  bookingId?: string;
  onSuccess: (payment: any) => void;
  onError: (error: Error) => void;
}

export function MercadoPagoButton({
  amount,
  description,
  tenantId,
  bookingId,
  onSuccess,
  onError
}: MercadoPagoButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/payments/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          description,
          tenantId,
          bookingId,
          paymentMethodId: 'pix', // o cualquier otro método
          payerEmail: 'customer@example.com',
          externalReference: generateExternalReference()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear pago');
      }

      // Redirigir a Mercado Pago para completar el pago
      window.location.href = data.payment.init_point;

      // En una implementación real, aquí se manejaría el retorno de Mercado Pago
      // y se llamaría a onSuccess con la información del pago
    } catch (error) {
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center"
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Procesando...
        </>
      ) : (
        <>
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16l-6.336 6.336c-.294.294-.768.294-1.062 0l-3.168-3.168c-.294-.294-.294-.768 0-1.062s.768-.294 1.062 0l2.637 2.637 5.805-5.805c.294-.294.768-.294 1.062 0s.294.768 0 1.062z"/>
          </svg>
          Pagar con Mercado Pago
        </>
      )}
    </button>
  );
}

// apps/web/components/payments/PaymentStatus.tsx
interface PaymentStatusProps {
  bookingId: string;
  onPaymentComplete: () => void;
}

export function PaymentStatus({ bookingId, onPaymentComplete }: PaymentStatusProps) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const response = await fetch(`/api/payments/booking/${bookingId}`);
        const data = await response.json();

        if (response.ok) {
          setPayment(data.payment);

          // Si el pago está aprobado, notificar al componente padre
          if (data.payment?.status === 'approved') {
            onPaymentComplete();
          }
        }
      } catch (error) {
        console.error('Error fetching payment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();

    // Verificar estado del pago cada 5 segundos
    const interval = setInterval(fetchPayment, 5000);

    return () => clearInterval(interval);
  }, [bookingId, onPaymentComplete]);

  if (loading) return <div>Verificando pago...</div>;

  if (!payment) {
    return <div>No se encontró información del pago</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprobado';
      case 'pending': return 'Pendiente';
      case 'rejected': return 'Rechazado';
      default: return status;
    }
  };

  return (
    <div className="payment-status">
      <h3 className="text-lg font-semibold">Estado del Pago</h3>
      <div className="mt-2">
        <p>
          <span className="font-medium">ID:</span> {payment.id}
        </p>
        <p>
          <span className="font-medium">Estado:</span>
          <span className={`font-semibold ${getStatusColor(payment.status)}`}>
            {getStatusText(payment.status)}
          </span>
        </p>
        <p>
          <span className="font-medium">Monto:</span> ${payment.amount.toFixed(2)}
        </p>
        <p>
          <span className="font-medium">Método:</span> {payment.method}
        </p>
      </div>
    </div>
  );
}
```

## Plan de Testing

### Estrategia de Testing

- **Pruebas Unitarias**: Verificar funcionamiento individual de componentes y funciones
- **Pruebas de Integración**: Verificar interacción entre componentes y sistemas
- **Pruebas End-to-End**: Verificar flujos completos del usuario
- **Pruebas de Aceptación**: Verificar que el sistema cumple con los requisitos del negocio
- **Pruebas de Carga**: Verificar rendimiento bajo estrés
- **Pruebas de Seguridad**: Verificar vulnerabilidades y protección de datos

### Casos de Prueba Clave

#### Sistema de Reservas

1. **Creación de Reserva**: Verificar que se pueda crear una reserva correctamente
2. **Disponibilidad**: Verificar que el sistema detecte conflictos de horario
3. **Cancelación**: Verificar que se pueda cancelar una reserva correctamente
4. **Recordatorios**: Verificar que se envíen recordatorios automáticos
5. **Integración con Google Calendar**: Verificar sincronización con calendario externo

#### Modo Offline

1. **Detección de Conexión**: Verificar que el sistema detecte correctamente el estado de conexión
2. **Operaciones Offline**: Verificar que se puedan realizar operaciones sin conexión
3. **Sincronización**: Verificar que las operaciones se sincronicen al restaurar la conexión
4. **Cola de Operaciones**: Verificar que las operaciones se almacenen correctamente en la cola
5. **Experiencia de Usuario**: Verificar que la experiencia offline sea intuitiva

#### Integración con Mercado Pago

1. **Creación de Pago**: Verificar que se pueda crear un pago correctamente
2. **Procesamiento de Pago**: Verificar que el pago se procese correctamente
3. **Webhooks**: Verificar que los webhooks se procesen correctamente
4. **Estados de Pago**: Verificar que los estados de pago se actualicen correctamente
5. **Experiencia de Pago**: Verificar que la experiencia de pago sea fluida

### Herramientas de Testing

- **Jest/Vitest**: Para pruebas unitarias y de integración
- **Playwright**: Para pruebas end-to-end
- **Postman**: Para pruebas de API
- **Lighthouse**: Para pruebas de rendimiento y accesibilidad
- **OWASP ZAP**: Para pruebas de seguridad

## Plan de Lanzamiento

### Estrategia de Lanzamiento

1. **Lanzamiento Beta**: Lanzamiento a un grupo seleccionado de clientes para pruebas
2. **Lanzamiento por Fases**: Lanzamiento gradual a todos los clientes
3. **Monitoreo Intensivo**: Monitoreo cercano durante las primeras semanas
4. **Feedback Rápido**: Recopilación y respuesta rápida al feedback de los clientes

### Comunicación del Lanzamiento

1. **Anuncio Previo**: Comunicar a los clientes sobre las nuevas funcionalidades
2. **Documentación**: Proporcionar documentación detallada sobre cómo usar las nuevas funcionalidades
3. **Capacitación**: Ofrecer sesiones de capacitación para los clientes
4. **Soporte Adicional**: Proporcionar soporte adicional durante el período de lanzamiento

### Métricas de Éxito del Lanzamiento

1. **Adopción**: Porcentaje de clientes que usan las nuevas funcionalidades
2. **Satisfacción**: NPS y CSAT para las nuevas funcionalidades
3. **Incidencias**: Número de incidencias reportadas
4. **Rendimiento**: Tiempo de respuesta y disponibilidad del sistema

## Conclusión

Este plan de implementación inmediata para la Fase 1 proporciona un marco detallado y ejecutable para desarrollar las tres mejoras críticas que permitirán a SASS Store comenzar a superar a Fudo en el mercado. El plan está diseñado para ejecutarse en 4-6 semanas con un enfoque ágil y resultados rápidos.

La implementación exitosa de esta Fase 1 no solo proporcionará funcionalidades valiosas a los clientes, sino que también validará la capacidad del equipo para ejecutar el plan completo y generará impulso para las fases siguientes.
