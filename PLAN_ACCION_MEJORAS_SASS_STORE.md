# Plan de Acción: Mejoras para Superar a Fudo

## Resumen Ejecutivo

Este documento detalla el plan de implementación para las mejoras estratégicas que permitirán a SASS Store superar a Fudo en el mercado de soluciones de gestión para negocios. El plan se divide en tres fases, priorizando las mejoras que generen mayor valor diferencial.

## Fase 1: Mejoras Críticas (1-2 meses)

### 1.1 Sistema de Reservas Avanzado

#### Objetivo

Implementar un sistema de reservas completo que sea una ventaja competitiva directa sobre Fudo, que no ofrece esta funcionalidad.

#### Tareas Específicas

**1.1.1 Diseño de la Interfaz**

- [ ] Crear mockups del calendario de reservas
- [ ] Diseñar flujo de reserva paso a paso
- [ ] Diseñar vista de administración de reservas
- [ ] Crear componentes reutilizables para el calendario

**1.1.2 Backend - Modelo de Datos**

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
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, confirmed, cancelled, completed
  notes TEXT,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
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

**1.1.3 API Endpoints**

```typescript
// apps/api/app/api/bookings/route.ts
export async function GET(request: Request) {
  // Listar reservas con filtros
}

export async function POST(request: Request) {
  // Crear nueva reserva
}

// apps/api/app/api/bookings/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  // Obtener detalle de reserva
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  // Actualizar reserva
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  // Cancelar reserva
}
```

**1.1.4 Frontend - Componentes**

```typescript
// apps/web/components/booking/BookingCalendar.tsx
interface BookingCalendarProps {
  tenantId: string;
  services: Service[];
  staff: Staff[];
  onSelectSlot: (slot: TimeSlot) => void;
}

// apps/web/components/booking/BookingForm.tsx
interface BookingFormProps {
  service: Service;
  selectedSlot: TimeSlot;
  onSubmit: (data: BookingData) => void;
}

// apps/web/components/booking/BookingList.tsx
interface BookingListProps {
  bookings: Booking[];
  onCancel: (id: string) => void;
  onReschedule: (id: string, newSlot: TimeSlot) => void;
}
```

**1.1.5 Integración con Google Calendar**

```typescript
// apps/web/lib/google-calendar.ts
export class GoogleCalendarService {
  async syncBookings(tenantId: string) {
    // Sincronizar reservas con Google Calendar
  }

  async createCalendarEvent(booking: Booking) {
    // Crear evento en Google Calendar
  }

  async updateCalendarEvent(booking: Booking) {
    // Actualizar evento en Google Calendar
  }

  async deleteCalendarEvent(bookingId: string) {
    // Eliminar evento en Google Calendar
  }
}
```

**1.1.6 Recordatorios Automáticos**

```typescript
// apps/web/lib/notification-service.ts
export class NotificationService {
  async sendBookingReminder(booking: Booking) {
    // Enviar recordatorio por SMS/Email
  }

  async scheduleReminders() {
    // Programar recordatorios para todas las reservas
  }
}
```

#### Responsables

- Frontend: 1 desarrollador React/Next.js
- Backend: 1 desarrollador Node.js/TypeScript
- UI/UX: 1 diseñador

#### Tiempo Estimado

- 3 semanas para desarrollo completo
- 1 semana para testing y refinamiento

### 1.2 Modo Offline con Sincronización

#### Objetivo

Implementar un modo offline funcional que permita continuar operando sin conexión a internet, superando la limitación de Fudo que requiere conexión permanente.

#### Tareas Específicas

**1.2.1 Service Worker para Caché**

```typescript
// public/sw.js
self.addEventListener("install", (event) => {
  // Instalar Service Worker
});

self.addEventListener("fetch", (event) => {
  // Interceptar peticiones y responder desde caché si está offline
});

self.addEventListener("sync", (event) => {
  // Sincronizar operaciones pendientes al restaurar conexión
});
```

**1.2.2 Cola de Operaciones Pendientes**

```typescript
// apps/web/lib/offline-queue.ts
export class OfflineQueue {
  private queue: Operation[] = [];

  add(operation: Operation) {
    // Agregar operación a la cola
    this.queue.push(operation);
    this.saveToLocalStorage();
  }

  async processAll() {
    // Procesar todas las operaciones pendientes
    for (const operation of this.queue) {
      await this.processOperation(operation);
    }
    this.clear();
  }

  private async processOperation(operation: Operation) {
    // Procesar operación individual
    switch (operation.type) {
      case "CREATE_BOOKING":
        await this.createBooking(operation.data);
        break;
      case "UPDATE_PRODUCT":
        await this.updateProduct(operation.data);
        break;
      // otros tipos de operaciones
    }
  }
}
```

**1.2.3 Notificador de Estado de Conexión**

```typescript
// apps/web/components/ui/ConnectionStatus.tsx
interface ConnectionStatusProps {
  onStatusChange: (isOnline: boolean) => void;
}

export function ConnectionStatus({ onStatusChange }: ConnectionStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      onStatusChange(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      onStatusChange(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onStatusChange]);

  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-md ${
      isOnline ? 'bg-green-500' : 'bg-red-500'
    } text-white`}>
      {isOnline ? 'Conectado' : 'Sin conexión - Modo offline activado'}
    </div>
  );
}
```

**1.2.4 Modo de Emergencia**

```typescript
// apps/web/lib/emergency-mode.ts
export class EmergencyMode {
  private isActive = false;

  activate() {
    this.isActive = true;
    // Limitar funcionalidad a operaciones críticas
    // Mostrar UI simplificada
  }

  deactivate() {
    this.isActive = false;
    // Restaurar funcionalidad completa
  }

  isEmergencyMode() {
    return this.isActive;
  }
}
```

#### Responsables

- Frontend: 1 desarrollador con experiencia en Service Workers
- Backend: 1 desarrollador para API de sincronización

#### Tiempo Estimado

- 2 semanas para desarrollo completo
- 1 semana para testing en diferentes escenarios de conexión

### 1.3 Integración con Mercado Pago

#### Objetivo

Integrar Mercado Pago como principal método de pago, aprovechando su popularidad en Latinoamérica y ofreciendo una ventaja sobre Fudo.

#### Tareas Específicas

**1.3.1 Configuración de Mercado Pago**

```typescript
// apps/web/lib/mercadopago.ts
import { MercadoPagoConfig, Payment } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

export const payment = new Payment(client);
```

**1.3.2 API Endpoints para Pagos**

```typescript
// apps/api/app/api/payments/mercadopago/route.ts
export async function POST(request: Request) {
  const { amount, description, tenantId } = await request.json();

  try {
    const payment = await payment.create({
      transaction_amount: amount,
      description: description,
      payment_method_id: "pix", // o cualquier otro método
      payer: {
        email: "test@test.com",
      },
    });

    return Response.json({ payment });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// apps/api/app/api/payments/mercadopago/webhook/route.ts
export async function POST(request: Request) {
  // Procesar webhook de Mercado Pago
  // Actualizar estado de pago en la base de datos
}
```

**1.3.3 Componentes de Pago**

```typescript
// apps/web/components/payments/MercadoPagoButton.tsx
interface MercadoPagoButtonProps {
  amount: number;
  description: string;
  onSuccess: (paymentId: string) => void;
  onError: (error: Error) => void;
}

export function MercadoPagoButton({
  amount,
  description,
  onSuccess,
  onError
}: MercadoPagoButtonProps) {
  const handleClick = async () => {
    try {
      const response = await fetch('/api/payments/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description }),
      });

      const { payment } = await response.json();

      // Redirigir a Mercado Pago o mostrar checkout en el sitio
      window.location.href = payment.init_point;
    } catch (error) {
      onError(error);
    }
  };

  return (
    <button onClick={handleClick} className="bg-blue-500 text-white px-4 py-2 rounded">
      Pagar con Mercado Pago
    </button>
  );
}
```

**1.3.4 Gestión de Suscripciones**

```typescript
// apps/web/lib/mercadopago-subscriptions.ts
export class MercadoPagoSubscriptions {
  async createSubscription(planId: string, customerId: string) {
    // Crear suscripción recurrente
  }

  async cancelSubscription(subscriptionId: string) {
    // Cancelar suscripción
  }

  async updateSubscription(subscriptionId: string, planId: string) {
    // Actualizar plan de suscripción
  }
}
```

#### Responsables

- Backend: 1 desarrollador con experiencia en integraciones de pago
- Frontend: 1 desarrollador para componentes de UI

#### Tiempo Estimado

- 2 semanas para integración básica
- 1 semana adicional para suscripciones y funcionalidades avanzadas

## Fase 2: Diferenciadores Clave (2-3 meses)

### 2.1 Programa de Fidelización de Clientes

#### Objetivo

Implementar un sistema de fidelización completo que genere retención de clientes y aumente el valor del ciclo de vida, una funcionalidad que Fudo no ofrece.

#### Tareas Específicas

**2.1.1 Modelo de Datos**

```sql
-- Tabla de programa de fidelización
CREATE TABLE loyalty_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(100) NOT NULL,
  points_per_purchase DECIMAL(10,2) NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de niveles de membresía
CREATE TABLE membership_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loyalty_program_id UUID NOT NULL REFERENCES loyalty_programs(id),
  name VARCHAR(50) NOT NULL,
  min_points INTEGER NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  benefits JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de puntos de clientes
CREATE TABLE customer_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  loyalty_program_id UUID NOT NULL REFERENCES loyalty_programs(id),
  points INTEGER NOT NULL DEFAULT 0,
  membership_tier_id UUID REFERENCES membership_tiers(id),
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Tabla de transacciones de puntos
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_points_id UUID NOT NULL REFERENCES customer_points(id),
  type VARCHAR(20) NOT NULL, -- 'earned', 'redeemed'
  points INTEGER NOT NULL,
  reference_id UUID, -- ID de orden, reserva, etc.
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**2.1.2 API Endpoints**

```typescript
// apps/api/app/api/loyalty/programs/route.ts
export async function GET(request: Request) {
  // Listar programas de fidelización
}

export async function POST(request: Request) {
  // Crear programa de fidelización
}

// apps/api/app/api/loyalty/points/[customerId]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { customerId: string } },
) {
  // Obtener puntos de un cliente
}

export async function POST(
  request: Request,
  { params }: { params: { customerId: string } },
) {
  // Añadir o redimir puntos
}
```

**2.1.3 Componentes de UI**

```typescript
// apps/web/components/loyalty/LoyaltyCard.tsx
interface LoyaltyCardProps {
  customer: Customer;
  points: number;
  tier: MembershipTier;
  onRedeem: (rewardId: string) => void;
}

export function LoyaltyCard({ customer, points, tier, onRedeem }: LoyaltyCardProps) {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
      <h3 className="text-xl font-bold">Programa de Fidelización</h3>
      <p className="text-2xl mt-2">{points} Puntos</p>
      <p className="text-sm mt-1">Nivel: {tier.name}</p>
      <div className="mt-4">
        <h4 className="font-semibold">Beneficios:</h4>
        <ul className="text-sm mt-2">
          {tier.benefits.map((benefit, index) => (
            <li key={index}>• {benefit}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// apps/web/components/loyalty/RewardsCatalog.tsx
interface RewardsCatalogProps {
  rewards: Reward[];
  onRedeem: (rewardId: string) => void;
}

export function RewardsCatalog({ rewards, onRedeem }: RewardsCatalogProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {rewards.map((reward) => (
        <div key={reward.id} className="border rounded-lg p-4">
          <h3 className="font-semibold">{reward.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{reward.description}</p>
          <p className="text-lg font-bold mt-2">{reward.points} puntos</p>
          <button
            onClick={() => onRedeem(reward.id)}
            className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm"
          >
            Canjear
          </button>
        </div>
      ))}
    </div>
  );
}
```

**2.1.4 Sistema de Notificaciones**

```typescript
// apps/web/lib/loyalty-notifications.ts
export class LoyaltyNotifications {
  async sendTierUpgrade(customerId: string, newTier: MembershipTier) {
    // Enviar notificación de upgrade de nivel
  }

  async sendPointsEarned(
    customerId: string,
    points: number,
    description: string,
  ) {
    // Enviar notificación de puntos ganados
  }

  async sendRewardExpiring(
    customerId: string,
    reward: Reward,
    daysLeft: number,
  ) {
    // Enviar notificación de recompensa por expirar
  }
}
```

#### Responsables

- Backend: 1 desarrollador
- Frontend: 1 desarrollador
- UI/UX: 1 diseñador

#### Tiempo Estimado

- 3 semanas para desarrollo completo
- 1 semana para testing y refinamiento

### 2.2 Analytics Predictivo con IA

#### Objetivo

Implementar un sistema de analytics predictivo que ayude a los dueños de negocios a tomar mejores decisiones basadas en datos, una ventaja competitiva sobre Fudo.

#### Tareas Específicas

**2.2.1 Modelo de Datos para Analytics**

```sql
-- Tabla de predicciones
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  prediction_type VARCHAR(50) NOT NULL, -- 'demand', 'revenue', 'churn'
  prediction_date DATE NOT NULL,
  predicted_value DECIMAL(15,2) NOT NULL,
  confidence_level DECIMAL(5,2),
  model_version VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de insights accionables
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  insight_type VARCHAR(50) NOT NULL, -- 'pricing', 'inventory', 'marketing'
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  action_required TEXT,
  priority INTEGER DEFAULT 1, -- 1-5
  status VARCHAR(20) DEFAULT 'pending', -- pending, acknowledged, completed
  created_at TIMESTAMP DEFAULT NOW()
);
```

**2.2.2 Servicios de IA**

```typescript
// apps/api/lib/ai/predictions.ts
export class PredictionService {
  async predictDemand(tenantId: string, days: number = 30) {
    // Predecir demanda para los próximos días
    // Usar histórico de ventas, reservas, temporada, etc.
  }

  async predictRevenue(tenantId: string, period: "week" | "month" | "quarter") {
    // Predecir ingresos para el período especificado
  }

  async predictChurn(tenantId: string) {
    // Predecir clientes con riesgo de abandono
    // Basado en frecuencia de compra, tiempo desde última visita, etc.
  }

  async optimizePricing(tenantId: string, serviceId: string) {
    // Recomendar precios óptimos basados en demanda, competencia, etc.
  }

  async recommendInventory(tenantId: string) {
    // Recomendar niveles de inventario basados en predicciones
  }
}
```

**2.2.3 API Endpoints**

```typescript
// apps/api/app/api/analytics/predictions/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");
  const type = searchParams.get("type"); // demand, revenue, churn

  if (!tenantId || !type) {
    return Response.json({ error: "Missing parameters" }, { status: 400 });
  }

  const predictionService = new PredictionService();

  switch (type) {
    case "demand":
      const demand = await predictionService.predictDemand(tenantId);
      return Response.json({ demand });
    case "revenue":
      const revenue = await predictionService.predictRevenue(tenantId, "month");
      return Response.json({ revenue });
    case "churn":
      const churn = await predictionService.predictChurn(tenantId);
      return Response.json({ churn });
    default:
      return Response.json(
        { error: "Invalid prediction type" },
        { status: 400 },
      );
  }
}

// apps/api/app/api/analytics/insights/route.ts
export async function GET(request: Request) {
  // Obtener insights para un tenant
}

export async function PUT(request: Request) {
  // Actualizar estado de insight (acknowledged, completed)
}
```

**2.2.4 Dashboard de Analytics**

```typescript
// apps/web/components/analytics/PredictiveDashboard.tsx
interface PredictiveDashboardProps {
  tenantId: string;
}

export function PredictiveDashboard({ tenantId }: PredictiveDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PredictionCard
          title="Predicción de Demanda"
          type="demand"
          tenantId={tenantId}
        />
        <PredictionCard
          title="Predicción de Ingresos"
          type="revenue"
          tenantId={tenantId}
        />
        <PredictionCard
          title="Clientes en Riesgo"
          type="churn"
          tenantId={tenantId}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PriceOptimizationPanel tenantId={tenantId} />
        <InventoryRecommendationsPanel tenantId={tenantId} />
      </div>

      <InsightsList tenantId={tenantId} />
    </div>
  );
}

// apps/web/components/analytics/PredictionCard.tsx
interface PredictionCardProps {
  title: string;
  type: string;
  tenantId: string;
}

export function PredictionCard({ title, type, tenantId }: PredictionCardProps) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrediction = async () => {
      const response = await fetch(`/api/analytics/predictions?type=${type}&tenantId=${tenantId}`);
      const data = await response.json();
      setPrediction(data);
      setLoading(false);
    };

    fetchPrediction();
  }, [type, tenantId]);

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="font-semibold">{title}</h3>
      {/* Renderizar predicción específica según el tipo */}
    </div>
  );
}
```

#### Responsables

- Backend/IA: 1 desarrollador con experiencia en modelos predictivos
- Frontend: 1 desarrollador para dashboard y visualizaciones
- Data Scientist: 1 para desarrollar y refinar modelos

#### Tiempo Estimado

- 4 semanas para desarrollo completo
- 2 semanas adicionales para entrenamiento y refinamiento de modelos

### 2.3 Facturación Electrónica Mejorada

#### Objetivo

Implementar un sistema robusto de facturación electrónica CFDI para México, resolviendo los problemas que Fudo tiene en esta área.

#### Tareas Específicas

**2.3.1 Modelo de Datos**

```sql
-- Tabla de facturas
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  customer_id UUID REFERENCES customers(id),
  order_id UUID REFERENCES orders(id),
  booking_id UUID REFERENCES bookings(id),
  invoice_type VARCHAR(10) NOT NULL, -- 'ingreso', 'egreso'
  payment_method VARCHAR(50) NOT NULL,
  subtotal DECIMAL(15,2) NOT NULL,
  tax DECIMAL(15,2) NOT NULL,
  total DECIMAL(15,2) NOT NULL,
  uuid VARCHAR(36), -- UUID del CFDI
  folio VARCHAR(20),
  serie VARCHAR(10),
  certificate_number VARCHAR(20),
  seal VARCHAR(255),
  stamp_date TIMESTAMP,
  pac VARCHAR(50), -- Proveedor autorizado de certificación
  status VARCHAR(20) DEFAULT 'draft', -- draft, issued, cancelled
  xml_url TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de conceptos de factura
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  product_id UUID REFERENCES products(id),
  service_id UUID REFERENCES services(id),
  description VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(5,2) NOT NULL,
  tax_amount DECIMAL(15,2) NOT NULL
);

-- Tabla de configuración de facturación por tenant
CREATE TABLE billing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  rfc VARCHAR(13) NOT NULL,
  business_name VARCHAR(200) NOT NULL,
  fiscal_regime VARCHAR(10) NOT NULL,
  postal_code VARCHAR(5) NOT NULL,
  cer_file TEXT, -- Certificado en base64
  key_file TEXT, -- Llave privada en base64
  password_cer TEXT, -- Contraseña del certificado
  pac_api_key TEXT,
  pac_user TEXT,
  pac_password TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**2.3.2 Servicio de Facturación**

```typescript
// apps/api/lib/billing/cfdi-service.ts
export class CFDIService {
  async generateInvoice(invoiceData: InvoiceData) {
    // Generar factura CFDI
    // 1. Crear XML del CFDI
    // 2. Sellar con certificado digital
    // 3. Enviar a PAC para timbrado
    // 4. Guardar UUID y datos de timbrado
  }

  async cancelInvoice(invoiceId: string) {
    // Cancelar factura CFDI
  }

  async downloadXML(invoiceId: string) {
    // Descargar XML de factura
  }

  async downloadPDF(invoiceId: string) {
    // Generar y descargar PDF de factura
  }

  async validateCertificate(config: BillingConfig) {
    // Validar certificado digital
  }
}
```

**2.3.3 API Endpoints**

```typescript
// apps/api/app/api/billing/invoices/route.ts
export async function GET(request: Request) {
  // Listar facturas
}

export async function POST(request: Request) {
  // Crear nueva factura
}

// apps/api/app/api/billing/invoices/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  // Obtener detalle de factura
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  // Actualizar factura
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  // Cancelar factura
}

// apps/api/app/api/billing/invoices/[id]/xml/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  // Descargar XML
}

// apps/api/app/api/billing/invoices/[id]/pdf/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  // Descargar PDF
}
```

**2.3.4 Componentes de UI**

```typescript
// apps/web/components/billing/InvoiceForm.tsx
interface InvoiceFormProps {
  tenantId: string;
  order?: Order;
  booking?: Booking;
  onSave: (invoice: Invoice) => void;
}

export function InvoiceForm({
  tenantId,
  order,
  booking,
  onSave,
}: InvoiceFormProps) {
  // Formulario para crear factura
}

// apps/web/components/billing/InvoiceList.tsx
interface InvoiceListProps {
  tenantId: string;
  invoices: Invoice[];
  onCancel: (id: string) => void;
  onDownloadXML: (id: string) => void;
  onDownloadPDF: (id: string) => void;
}

export function InvoiceList({
  tenantId,
  invoices,
  onCancel,
  onDownloadXML,
  onDownloadPDF,
}: InvoiceListProps) {
  // Lista de facturas con acciones
}

// apps/web/components/billing/BillingConfig.tsx
interface BillingConfigProps {
  tenantId: string;
  config: BillingConfig;
  onSave: (config: BillingConfig) => void;
}

export function BillingConfig({
  tenantId,
  config,
  onSave,
}: BillingConfigProps) {
  // Configuración de facturación para el tenant
}
```

#### Responsables

- Backend: 1 desarrollador con experiencia en CFDI
- Frontend: 1 desarrollador para componentes de UI
- Especialista fiscal: 1 consultor para validar requisitos legales

#### Tiempo Estimado

- 3 semanas para desarrollo básico
- 2 semanas adicionales para integración con PAC y validación

## Fase 3: Expansión (3-4 meses)

### 3.1 Sistema de Delivery Propio

#### Objetivo

Implementar un sistema de delivery completo que permita a los negocios gestionar sus propias entregas sin depender de terceros, una ventaja sobre Fudo que solo se integra con apps de delivery.

#### Tareas Específicas

**3.1.1 Modelo de Datos**

```sql
-- Tabla de repartidores
CREATE TABLE delivery_drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  license_plate VARCHAR(20),
  vehicle_type VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de entregas
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  driver_id UUID REFERENCES delivery_drivers(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, assigned, in_progress, delivered, cancelled
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  pickup_latitude DECIMAL(10,8),
  pickup_longitude DECIMAL(11,8),
  delivery_latitude DECIMAL(10,8),
  delivery_longitude DECIMAL(11,8),
  estimated_duration INTEGER, -- minutos estimados
  actual_duration INTEGER, -- minutos reales
  distance DECIMAL(10,2), -- kilómetros
  cost DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de tracking de entregas
CREATE TABLE delivery_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id),
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

**3.1.2 Servicio de Optimización de Rutas**

```typescript
// apps/api/lib/delivery/route-optimizer.ts
export class RouteOptimizer {
  async optimizeRoute(deliveries: Delivery[]) {
    // Optimizar rutas de entrega usando algoritmos como TSP
    // Considerar distancia, tiempo, tráfico, etc.
  }

  async calculateDistance(pointA: LatLng, pointB: LatLng) {
    // Calcular distancia entre dos puntos
  }

  async estimateDuration(origin: LatLng, destination: LatLng) {
    // Estimar tiempo de entrega considerando tráfico
  }
}
```

**3.1.3 API Endpoints**

```typescript
// apps/api/app/api/delivery/drivers/route.ts
export async function GET(request: Request) {
  // Listar repartidores
}

export async function POST(request: Request) {
  // Crear repartidor
}

// apps/api/app/api/delivery/deliveries/route.ts
export async function GET(request: Request) {
  // Listar entregas
}

export async function POST(request: Request) {
  // Crear entrega
}

// apps/api/app/api/delivery/deliveries/[id]/assign/route.ts
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  // Asignar repartidor a entrega
}

// apps/api/app/api/delivery/deliveries/[id]/track/route.ts
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  // Actualizar ubicación de entrega
}
```

**3.1.4 Componentes de UI**

```typescript
// apps/web/components/delivery/DeliveryMap.tsx
interface DeliveryMapProps {
  deliveries: Delivery[];
  drivers: Driver[];
  onDeliverySelect: (delivery: Delivery) => void;
}

export function DeliveryMap({
  deliveries,
  drivers,
  onDeliverySelect,
}: DeliveryMapProps) {
  // Mapa con entregas y repartidores en tiempo real
}

// apps/web/components/delivery/DeliveryList.tsx
interface DeliveryListProps {
  deliveries: Delivery[];
  onAssignDriver: (deliveryId: string, driverId: string) => void;
  onUpdateStatus: (deliveryId: string, status: string) => void;
}

export function DeliveryList({
  deliveries,
  onAssignDriver,
  onUpdateStatus,
}: DeliveryListProps) {
  // Lista de entregas con acciones
}

// apps/web/components/delivery/DriverTracking.tsx
interface DriverTrackingProps {
  driverId: string;
}

export function DriverTracking({ driverId }: DriverTrackingProps) {
  // Seguimiento en tiempo real de un repartidor
}
```

**3.1.5 Notificaciones para Clientes**

```typescript
// apps/web/lib/delivery-notifications.ts
export class DeliveryNotifications {
  async sendOrderConfirmation(order: Order, delivery: Delivery) {
    // Enviar confirmación de pedido con detalles de entrega
  }

  async sendDriverAssigned(order: Order, driver: Driver) {
    // Enviar notificación de repartidor asignado
  }

  async sendDeliveryInProgress(order: Order, eta: number) {
    // Enviar notificación de entrega en curso con ETA
  }

  async sendDeliveryCompleted(order: Order) {
    // Enviar notificación de entrega completada
  }
}
```

#### Responsables

- Backend: 1 desarrollador
- Frontend: 1 desarrollador
- Especialista en mapas: 1 para integración con mapas y optimización de rutas

#### Tiempo Estimado

- 4 semanas para desarrollo básico
- 2 semanas adicionales para optimización de rutas y testing

### 3.2 Comunidad y Marketplace

#### Objetivo

Crear una comunidad y marketplace que conecte a los tenants de SASS Store, generando un ecosistema que va más allá del software y crea un efecto de red.

#### Tareas Específicas

**3.2.1 Modelo de Datos**

```sql
-- Tabla de productos del marketplace
CREATE TABLE marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  images JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de servicios del marketplace
CREATE TABLE marketplace_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  duration_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de foro de comunidad
CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50),
  is_pinned BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de respuestas del foro
CREATE TABLE community_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id),
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de reseñas
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  reviewer_tenant_id UUID NOT NULL REFERENCES tenants(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de eventos
CREATE TABLE community_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  is_virtual BOOLEAN DEFAULT false,
  location TEXT,
  max_attendees INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**3.2.2 API Endpoints**

```typescript
// apps/api/app/api/marketplace/products/route.ts
export async function GET(request: Request) {
  // Listar productos del marketplace
}

export async function POST(request: Request) {
  // Crear producto en marketplace
}

// apps/api/app/api/marketplace/services/route.ts
export async function GET(request: Request) {
  // Listar servicios del marketplace
}

export async function POST(request: Request) {
  // Crear servicio en marketplace
}

// apps/api/app/api/community/posts/route.ts
export async function GET(request: Request) {
  // Listar posts del foro
}

export async function POST(request: Request) {
  // Crear post en foro
}

// apps/api/app/api/community/events/route.ts
export async function GET(request: Request) {
  // Listar eventos
}

export async function POST(request: Request) {
  // Crear evento
}
```

**3.2.3 Componentes de UI**

```typescript
// apps/web/components/marketplace/MarketplaceHome.tsx
interface MarketplaceHomeProps {
  tenantId: string;
}

export function MarketplaceHome({ tenantId }: MarketplaceHomeProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MarketplaceSection
          title="Productos Destacados"
          type="products"
          tenantId={tenantId}
        />
        <MarketplaceSection
          title="Servicios Destacados"
          type="services"
          tenantId={tenantId}
        />
        <CommunitySection
          title="Actividad Reciente"
          tenantId={tenantId}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UpcomingEvents tenantId={tenantId} />
        <TopRatedBusinesses tenantId={tenantId} />
      </div>
    </div>
  );
}

// apps/web/components/marketplace/MarketplaceSection.tsx
interface MarketplaceSectionProps {
  title: string;
  type: 'products' | 'services';
  tenantId: string;
}

export function MarketplaceSection({ title, type, tenantId }: MarketplaceSectionProps) {
  // Sección de productos o servicios del marketplace
}

// apps/web/components/community/ForumHome.tsx
interface ForumHomeProps {
  tenantId: string;
}

export function ForumHome({ tenantId }: ForumHomeProps) {
  // Página principal del foro de comunidad
}

// apps/web/components/community/EventsCalendar.tsx
interface EventsCalendarProps {
  tenantId: string;
}

export function EventsCalendar({ tenantId }: EventsCalendarProps) {
  // Calendario de eventos de la comunidad
}
```

**3.2.4 Sistema de Reseñas y Calificaciones**

```typescript
// apps/web/lib/community/reviews.ts
export class ReviewService {
  async createReview(reviewData: ReviewData) {
    // Crear reseña
  }

  async getBusinessReviews(tenantId: string) {
    // Obtener reseñas de un negocio
  }

  async calculateAverageRating(tenantId: string) {
    // Calificar promedio de un negocio
  }

  async verifyReview(reviewId: string) {
    // Verificar que una reseña es legítima
  }
}
```

**3.2.5 Sistema de Notificaciones de Comunidad**

```typescript
// apps/web/lib/community/notifications.ts
export class CommunityNotifications {
  async sendNewPostNotification(post: CommunityPost) {
    // Enviar notificación de nuevo post relevante
  }

  async sendReplyNotification(reply: CommunityReply) {
    // Enviar notificación de respuesta a post
  }

  async sendEventReminder(event: CommunityEvent, userId: string) {
    // Enviar recordatorio de evento
  }

  async sendNewReviewNotification(review: Review) {
    // Enviar notificación de nueva reseña
  }
}
```

#### Responsables

- Backend: 1 desarrollador
- Frontend: 1 desarrollador
- Community Manager: 1 para moderar y fomentar la comunidad

#### Tiempo Estimado

- 4 semanas para desarrollo básico
- 2 semanas adicionales para testing y refinamiento

## Métricas de Éxito y KPIs

### Métricas de Producto

- **Tasa de adopción**: 50+ nuevos negocios/mes
- **Retención de clientes**: >90% mensual
- **Satisfacción del cliente**: NPS >50
- **Uptime**: 99.9%
- **Tiempo de respuesta**: <200ms para APIs críticas

### Métricas de Negocio

- **Ingresos recurrentes**: $10,000+ USD/mes
- **Costo de adquisición**: < $50 USD por cliente
- **Lifetime Value**: > $2,000 USD por cliente
- **Margen bruto**: >80%

### Métricas por Funcionalidad

- **Sistema de Reservas**: 70% de tenants activos usándolo regularmente
- **Modo Offline**: 95% de operaciones exitosas sin conexión
- **Mercado Pago**: 80% de transacciones procesadas por este medio
- **Fidelización**: 60% de clientes activos en el programa
- **Analytics Predictivo**: 70% de tenants accediendo semanalmente
- **Facturación Electrónica**: 90% de facturas generadas sin errores
- **Delivery Propio**: 50% de tenants con servicio a domicilio usándolo
- **Comunidad**: 30% de tenants participando activamente

## Conclusión

Este plan de acción detalla la implementación de 8 mejoras estratégicas que permitirán a SASS Store superar a Fudo en el mercado. Las mejoras se dividen en tres fases, priorizando las que generan mayor valor diferencial y continuidad operativa.

La clave del éxito será una ejecución ordenada y enfocada, comenzando por las mejoras críticas que resuelven necesidades inmediatas de los clientes y continuando con los diferenciadores que crearán una ventaja competitiva sostenible.

---

**Próximos pasos inmediatos**:

1. Asignar recursos para Fase 1 (Sistema de Reservas, Modo Offline, Mercado Pago)
2. Comenzar desarrollo de prototipos para validar conceptos
3. Establecer métricas y KPIs para seguimiento
4. Planificar estrategia de lanzamiento y marketing para las nuevas funcionalidades
