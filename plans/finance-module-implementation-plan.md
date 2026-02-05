# 📊 Plan de Implementación: Módulo de Finanzas con Datos Reales

**Fecha**: 2026-01-22
**Estado**: Planeación
**Prioridad**: 🚨 ALTA

---

## 📋 Resumen Ejecutivo

El módulo de finanzas actualmente usa datos mock y no está conectado a la base de datos real. Este plan detalla cómo implementar el módulo de finanzas usando los datos reales que ya existen en Supabase.

### Problema Actual

- ❌ El hook `useFinance` hace llamadas a endpoints que no existen (`/api/finance/kpis`, `/api/finance/movements`, etc.)
- ❌ Los datos financieros se muestran como mock data
- ❌ No hay conexión con las tablas financieras de Supabase

### Solución Propuesta

- ✅ Crear endpoints de API de finanzas que consulten las tablas reales
- ✅ Implementar lógica de filtrado por tenant
- ✅ Calcular KPIs financieros en tiempo real
- ✅ Mostrar movimientos financieros reales de la base de datos

---

## 🗄️ Tablas Financieras en Supabase

### 1. Tablas Principales

#### `financial_kpis` (líneas 1142-1181)

Almacena KPIs financieros pre-calculados por tenant y fecha.

```typescript
{
  id: uuid,
  tenantId: uuid,
  date: date,
  totalIncome: decimal(12,2),
  totalExpenses: decimal(12,2),
  netCashFlow: decimal(12,2),
  averageTicket: decimal(10,2),
  approvalRate: decimal(5,2),
  transactionCount: integer,
  availableBalance: decimal(12,2),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `financial_movements` (líneas 1184-1209)

Almacena movimientos financieros (ingresos/gastos) por tenant.

```typescript
{
  id: uuid,
  tenantId: uuid,
  type: varchar(50), // "income" | "expense"
  paymentMethod: varchar(50),
  reconciled: boolean,
  movementDate: date,
  description: text,
  referenceId: text,
  counterparty: text,
  amount: decimal(12,2),
  reconciliationId: uuid,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 2. Tablas Relacionadas

#### `orders` (líneas 337-362)

Órdenes de compra que generan ingresos.

```typescript
{
  id: uuid,
  tenantId: uuid,
  orderNumber: varchar(100),
  customerName: varchar(100),
  customerEmail: varchar(255),
  customerPhone: varchar(20),
  status: varchar(20), // 'pending' | 'confirmed' | 'completed' | 'cancelled'
  type: varchar(20), // 'purchase' | 'booking'
  total: decimal(10,2),
  currency: varchar(3),
  metadata: jsonb,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `payments` (líneas 387-411)

Pagos de órdenes.

```typescript
{
  id: uuid,
  orderId: uuid,
  tenantId: uuid,
  stripePaymentIntentId: varchar(255),
  amount: decimal(10,2),
  currency: varchar(3),
  status: varchar(20), // 'pending' | 'completed' | 'failed'
  paidAt: timestamp,
  metadata: jsonb,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `customer_visits` (líneas 1526-1572)

Visitas de clientes que generan ingresos.

```typescript
{
  id: uuid,
  tenantId: uuid,
  customerId: uuid,
  appointmentId: uuid,
  visitNumber: integer,
  visitDate: timestamp,
  totalAmount: decimal(10,2),
  advanceApplied: decimal(10,2),
  remainingAmount: decimal(10,2),
  paymentStatus: varchar(20), // 'pending' | 'partially_paid' | 'fully_paid' | 'overpaid'
  notes: text,
  nextVisitFrom: date,
  nextVisitTo: date,
  status: varchar(20), // 'pending' | 'scheduled' | 'completed' | 'cancelled'
  metadata: jsonb,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `customer_visit_services` (líneas 1595-1621)

Servicios realizados en cada visita.

```typescript
{
  id: uuid,
  visitId: uuid,
  serviceId: uuid,
  description: text,
  unitPrice: decimal(10,2),
  quantity: decimal(5,2),
  subtotal: decimal(10,2),
  metadata: jsonb,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `customer_advances` (líneas 1677-1713)

Adelantos de clientes (pagos anticipados).

```typescript
{
  id: uuid,
  tenantId: uuid,
  customerId: uuid,
  amount: decimal(10,2),
  originalAmount: decimal(10,2),
  paymentMethod: varchar(50),
  referenceNumber: varchar(100),
  notes: text,
  status: varchar(20), // 'active' | 'partially_used' | 'fully_used' | 'cancelled'
  validUntil: timestamp,
  metadata: jsonb,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `advance_applications` (líneas 1716-1757)

Aplicaciones de adelantos a visitas/servicios.

```typescript
{
  id: uuid,
  tenantId: uuid,
  advanceId: uuid,
  customerId: uuid,
  visitId: uuid,
  bookingId: uuid,
  amountApplied: decimal(10,2),
  notes: text,
  metadata: jsonb,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

## 🏗️ Arquitectura de la Solución

```mermaid
graph TB
    subgraph "Frontend"
        FinancePage[Finance Page]
        UseFinance[useFinance Hook]
    end

    subgraph "API Layer"
        KPIsEndpoint[/api/finance/kpis]
        MovementsEndpoint[/api/finance/movements]
        ReconcileEndpoint[/api/finance/movements/:id/reconcile]
        POSSales[/api/finance/pos/sales]
        POSTerminals[/api/finance/pos/terminals]
        ReportsSales[/api/finance/reports/sales]
        ReportsProducts[/api/finance/reports/products]
    end

    subgraph "Database Layer"
        FinancialKPIs[financial_kpis]
        FinancialMovements[financial_movements]
        Orders[orders]
        Payments[payments]
        CustomerVisits[customer_visits]
        CustomerVisitServices[customer_visit_services]
        CustomerAdvances[customer_advances]
        AdvanceApplications[advance_applications]
    end

    FinancePage --> UseFinance
    UseFinance --> KPIsEndpoint
    UseFinance --> MovementsEndpoint
    UseFinance --> POSSales
    UseFinance --> POSTerminals
    UseFinance --> ReportsSales
    UseFinance --> ReportsProducts
    UseFinance --> ReconcileEndpoint

    KPIsEndpoint --> FinancialKPIs
    KPIsEndpoint --> Orders
    KPIsEndpoint --> Payments
    KPIsEndpoint --> CustomerVisits

    MovementsEndpoint --> FinancialMovements
    MovementsEndpoint --> Orders
    MovementsEndpoint --> Payments
    MovementsEndpoint --> CustomerVisits
    MovementsEndpoint --> CustomerAdvances

    POSSales --> Orders
    POSSales --> Payments

    POSTerminals --> posTerminals

    ReportsSales --> Orders
    ReportsSales --> Payments
    ReportsSales --> CustomerVisits

    ReportsProducts --> CustomerVisitServices
    ReportsProducts --> Orders

    ReconcileEndpoint --> FinancialMovements

    style FinancePage fill:#61dafb
    style UseFinance fill:#61dafb
    style KPIsEndpoint fill:#68a063
    style MovementsEndpoint fill:#68a063
    style ReconcileEndpoint fill:#68a063
    style POSSales fill:#68a063
    style POSTerminals fill:#68a063
    style ReportsSales fill:#68a063
    style ReportsProducts fill:#68a063
    style FinancialKPIs fill:#336791
    style FinancialMovements fill:#336791
    style Orders fill:#336791
    style Payments fill:#336791
    style CustomerVisits fill:#336791
    style CustomerVisitServices fill:#336791
    style CustomerAdvances fill:#336791
    style AdvanceApplications fill:#336791
```

---

## 📝 Implementación de Endpoints

### 1. Endpoint: `/api/finance/kpis`

**Propósito**: Obtener KPIs financieros agregados por tenant y período.

**URL**: `GET /api/finance/kpis?period=month|week|day`

**Query Params**:

- `period`: `month` (default), `week`, `day`
- `tenant`: tenant slug (obtenido de la URL o headers)

**Lógica**:

1. Obtener el tenant ID desde el slug
2. Calcular el rango de fechas según el período
3. Consultar tablas para calcular KPIs:
   - **Ingresos Totales**: Suma de `orders.total` + `customer_visits.totalAmount` (solo completadas)
   - **Gastos Totales**: Suma de `financial_movements.amount` donde `type='expense'`
   - **Flujo de Caja Neto**: Ingresos - Gastos
   - **Ticket Promedio**: Ingresos Totales / Número de transacciones
   - **Tasa de Aprobación**: Pagos completados / Total de pagos
   - **Número de Transacciones**: Count de `orders` + `customer_visits`
   - **Saldo Disponible**: Suma de `customer_advances.amount` donde `status='active'`
4. Guardar KPIs calculados en `financial_kpis` (si no existen para esa fecha)
5. Retornar KPIs agregados

**Response**:

```json
{
  "aggregated": {
    "totalIncome": 12500.0,
    "totalExpenses": 3200.0,
    "netCashFlow": 9300.0,
    "averageTicket": 450.0,
    "approvalRate": 95.5,
    "transactionCount": 28,
    "availableBalance": 1500.0,
    "incomeTrend": 12.5,
    "expenseTrend": -5.2
  },
  "byDate": [
    {
      "date": "2026-01-20",
      "totalIncome": 450.0,
      "totalExpenses": 0.0,
      "netCashFlow": 450.0,
      "transactionCount": 1
    }
    // ...
  ]
}
```

---

### 2. Endpoint: `/api/finance/movements`

**Propósito**: Obtener movimientos financieros filtrados.

**URL**: `GET /api/finance/movements`

**Query Params**:

- `type`: `SETTLEMENT` | `REFUND` | `CHARGEBACK` | `WITHDRAWAL` | `FEE` | `CARD_PURCHASE`
- `paymentMethod`: `cash` | `card` | `mercadopago` | `transfer`
- `status`: `reconciled` | `unreconciled`
- `from`: fecha ISO
- `to`: fecha ISO
- `search`: texto para buscar en descripción
- `limit`: número (default 50)
- `offset`: número (default 0)
- `sortBy`: `movementDate` | `amount` | `type`
- `sortOrder`: `asc` | `desc`

**Lógica**:

1. Obtener el tenant ID desde el slug
2. Consultar `financial_movements` con filtros aplicados
3. También consultar `orders`, `payments`, `customer_visits`, `customer_advances`
4. Unificar todos los movimientos en un formato estándar
5. Aplicar paginación y ordenamiento
6. Retornar movimientos

**Response**:

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "SETTLEMENT",
      "amount": 450.0,
      "currency": "MXN",
      "description": "Venta de servicios",
      "referenceId": "order-123",
      "paymentMethod": "card",
      "counterparty": "María García",
      "movementDate": "2026-01-20",
      "reconciled": true,
      "reconciliationId": null
    }
    // ...
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### 3. Endpoint: `/api/finance/movements/[id]/reconcile`

**Propósito**: Reconciliar un movimiento financiero.

**URL**: `PATCH /api/finance/movements/[id]/reconcile`

**Body**:

```json
{
  "reconciled": true,
  "reconciliationId": "uuid-optional"
}
```

**Lógica**:

1. Obtener el tenant ID desde el slug
2. Actualizar el movimiento en `financial_movements`
3. Retornar movimiento actualizado

**Response**:

```json
{
  "id": "uuid",
  "reconciled": true,
  "reconciliationId": "uuid",
  "updatedAt": "2026-01-20T14:30:00Z"
}
```

---

### 4. Endpoint: `/api/finance/pos/sales`

**Propósito**: Crear una venta desde el POS.

**URL**: `POST /api/finance/pos/sales`

**Body**:

```json
{
  "terminalId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 2,
      "unitPrice": 150.00
    }
  ],
  "customerName": "María García",
  "customerEmail": "maria@example.com",
  "paymentMethod": "cash" | "card" | "mercadopago",
  "notes": "Venta de mostrador"
}
```

**Lógica**:

1. Obtener el tenant ID desde el slug
2. Crear orden en `orders`
3. Crear items en `order_items`
4. Si paymentMethod es `mercadopago`, procesar pago con Mercado Pago
5. Crear registro en `payments`
6. Crear movimiento en `financial_movements` (type='income')
7. Retornar orden creada

**Response**:

```json
{
  "id": "uuid",
  "orderNumber": "ORD-2026-001",
  "total": 300.0,
  "status": "completed",
  "paymentStatus": "paid",
  "createdAt": "2026-01-20T14:30:00Z"
}
```

---

### 5. Endpoint: `/api/finance/pos/terminals`

**Propósito**: Obtener terminales POS del tenant.

**URL**: `GET /api/finance/pos/terminals`

**Lógica**:

1. Obtener el tenant ID desde el slug
2. Consultar `pos_terminals` donde `tenantId` = tenant ID y `status='active'`
3. Retornar terminales

**Response**:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Terminal Principal",
      "terminalId": "POS-001",
      "status": "active",
      "location": "Recepción",
      "lastSync": "2026-01-20T14:30:00Z"
    }
  ]
}
```

---

### 6. Endpoint: `/api/finance/reports/sales`

**Propósito**: Generar reporte de ventas.

**URL**: `GET /api/finance/reports/sales`

**Query Params**:

- `from`: fecha ISO
- `to`: fecha ISO
- `terminalId`: uuid
- `paymentMethod`: `cash` | `card` | `mercadopago`
- `format`: `json` (default) | `pdf` | `excel`

**Lógica**:

1. Obtener el tenant ID desde el slug
2. Consultar `orders` con filtros aplicados
3. Consultar `payments` relacionados
4. Agregar datos por día, semana, mes según el rango
5. Generar reporte en el formato solicitado
6. Retornar reporte

**Response**:

```json
{
  "summary": {
    "totalSales": 12500.0,
    "totalOrders": 28,
    "averageTicket": 446.43,
    "byPaymentMethod": {
      "cash": 5000.0,
      "card": 6000.0,
      "mercadopago": 1500.0
    }
  },
  "byDate": [
    {
      "date": "2026-01-20",
      "totalSales": 1250.0,
      "orders": 3,
      "averageTicket": 416.67
    }
    // ...
  ],
  "details": [
    {
      "orderId": "uuid",
      "orderNumber": "ORD-2026-001",
      "customerName": "María García",
      "total": 450.0,
      "paymentMethod": "card",
      "status": "completed",
      "createdAt": "2026-01-20T14:30:00Z"
    }
    // ...
  ]
}
```

---

### 7. Endpoint: `/api/finance/reports/products`

**Propósito**: Generar reporte de productos/servicios más vendidos.

**URL**: `GET /api/finance/reports/products`

**Query Params**:

- `from`: fecha ISO
- `to`: fecha ISO
- `category`: categoría de productos/servicios
- `limit`: número
- `format`: `json` (default) | `pdf` | `excel`

**Lógica**:

1. Obtener el tenant ID desde el slug
2. Consultar `order_items` y `customer_visit_services`
3. Agregar por producto/servicio
4. Calcular métricas: cantidad vendida, total ingresos, margen
5. Ordenar por ingresos descendente
6. Retornar reporte

**Response**:

```json
{
  "summary": {
    "totalProducts": 150,
    "totalRevenue": 12500.0,
    "averagePrice": 83.33
  },
  "topProducts": [
    {
      "productId": "uuid",
      "name": "Corte de Cabello Premium",
      "category": "services",
      "quantitySold": 25,
      "totalRevenue": 7500.0,
      "averagePrice": 300.0,
      "margin": 0.6
    }
    // ...
  ],
  "byCategory": [
    {
      "category": "services",
      "totalRevenue": 10000.0,
      "percentage": 80.0
    },
    {
      "category": "products",
      "totalRevenue": 2500.0,
      "percentage": 20.0
    }
  ]
}
```

---

## 🔒 Seguridad y Multitenancy

### 1. Tenant Isolation

Todos los endpoints deben:

1. Obtener el tenant ID desde el slug en la URL o headers
2. Filtrar TODAS las consultas por `tenantId`
3. Validar que el usuario tenga permisos para acceder a los datos del tenant

### 2. RLS Policies

Asegurar que las tablas financieras tengan políticas RLS:

```sql
-- Ejemplo para financial_movements
CREATE POLICY tenant_isolation ON financial_movements
    FOR ALL TO application_role
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### 3. Autenticación

Verificar que el usuario esté autenticado antes de procesar cualquier solicitud:

```typescript
import { getServerSession } from "next-auth/next";

export async function GET(request: NextRequest) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Continuar con la lógica...
}
```

---

## 📊 Cálculo de KPIs

### Fórmulas

1. **Ingresos Totales**:

   ```typescript
   totalIncome =
     SUM(orders.total WHERE status='completed') +
     SUM(customer_visits.totalAmount WHERE status='completed') +
     SUM(customer_advances.amount WHERE status='active') // Adelantos como ingresos anticipados
   ```

2. **Gastos Totales**:

   ```typescript
   totalExpenses =
     SUM(financial_movements.amount WHERE type='expense')
   ```

3. **Flujo de Caja Neto**:

   ```typescript
   netCashFlow = totalIncome - totalExpenses;
   ```

4. **Ticket Promedio**:

   ```typescript
   transactionCount = COUNT(orders WHERE status='completed') + COUNT(customer_visits WHERE status='completed')
   averageTicket = totalIncome / transactionCount
   ```

5. **Tasa de Aprobación**:

   ```typescript
   totalPayments = COUNT(payments)
   completedPayments = COUNT(payments WHERE status='completed')
   approvalRate = (completedPayments / totalPayments) * 100
   ```

6. **Saldo Disponible**:

   ```typescript
   availableBalance =
     SUM(customer_advances.amount WHERE status='active') -
     SUM(customer_advances.amount WHERE status='partially_used')
   ```

7. **Tendencias**:
   ```typescript
   // Comparar con período anterior
   incomeTrend =
     ((currentPeriodIncome - previousPeriodIncome) / previousPeriodIncome) *
     100;
   expenseTrend =
     ((currentPeriodExpenses - previousPeriodExpenses) /
       previousPeriodExpenses) *
     100;
   ```

---

## 🎯 Pasos de Implementación

### Fase 1: Preparación

- [ ] Revisar estructura de carpetas de API
- [ ] Crear carpeta `/api/finance/`
- [ ] Configurar Drizzle ORM para consultas financieras

### Fase 2: Endpoints Básicos

- [ ] Implementar `/api/finance/kpis`
- [ ] Implementar `/api/finance/movements`
- [ ] Implementar `/api/finance/movements/[id]/reconcile`
- [ ] Probar endpoints con datos reales

### Fase 3: Endpoints POS

- [ ] Implementar `/api/finance/pos/sales`
- [ ] Implementar `/api/finance/pos/terminals`
- [ ] Probar funcionalidad POS

### Fase 4: Reportes

- [ ] Implementar `/api/finance/reports/sales`
- [ ] Implementar `/api/finance/reports/products`
- [ ] Probar generación de reportes

### Fase 5: Integración Frontend

- [ ] Verificar que hook `useFinance` funciona con nuevos endpoints
- [ ] Probar página de finanzas con datos reales
- [ ] Verificar filtrado por tenant
- [ ] Probar paginación y ordenamiento

### Fase 6: Testing

- [ ] Crear tests unitarios para endpoints
- [ ] Crear tests de integración
- [ ] Probar con múltiples tenants
- [ ] Verificar RLS policies

---

## 📁 Estructura de Archivos

```
apps/web/app/api/finance/
├── route.ts                    # Router principal
├── kpis/
│   └── route.ts              # GET /api/finance/kpis
├── movements/
│   ├── route.ts              # GET /api/finance/movements
│   └── [id]/
│       └── reconcile/
│           └── route.ts      # PATCH /api/finance/movements/[id]/reconcile
├── pos/
│   ├── sales/
│   │   └── route.ts        # POST /api/finance/pos/sales
│   └── terminals/
│       └── route.ts        # GET /api/finance/pos/terminals
└── reports/
    ├── sales/
    │   └── route.ts        # GET /api/finance/reports/sales
    └── products/
        └── route.ts        # GET /api/finance/reports/products
```

---

## 🧪 Testing Strategy

### 1. Unit Tests

- Testear cálculo de KPIs
- Testear filtros de movimientos
- Testear reconciliación
- Testear creación de ventas POS

### 2. Integration Tests

- Testear endpoints completos
- Testear filtrado por tenant
- Testear autenticación
- Testear RLS policies

### 3. E2E Tests

- Testear flujo completo de finanzas
- Testear reportes
- Testear POS
- Testear múltiples tenants

---

## 📚 Referencias

- [`packages/database/schema.ts`](packages/database/schema.ts:1) - Esquema de base de datos
- [`apps/web/lib/hooks/use-finance.ts`](apps/web/lib/hooks/use-finance.ts:1) - Hook de finanzas
- [`apps/web/app/t/[tenant]/finance/page.tsx`](apps/web/app/t/[tenant]/finance/page.tsx:1) - Página de finanzas
- [`README_DATABASE_SETUP.md`](README_DATABASE_SETUP.md:1) - Configuración de base de datos

---

## 🚀 Próximos Pasos

1. **Implementar endpoints de API** (Fase 1-4)
2. **Probar con datos reales** (Fase 5-6)
3. **Documentar API** (Swagger/OpenAPI)
4. **Deploy a staging**

---

**Última actualización**: 2026-01-22
**Autor**: Architect Agent
**Prioridad**: 🚨 ALTA
