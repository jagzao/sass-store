# SASS STORE - Documentación Completa del Proyecto

## Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Arquitectura del Sistema](#arquitectura-del-sistema)
5. [Funcionalidades Principales](#funcionalidades-principales)
6. [Base de Datos y Autenticación](#base-de-datos-y-autenticación)
7. [API y Rutas](#api-y-rutas)
8. [Deployment e Infraestructura](#deployment-e-infraestructura)
9. [Seguridad](#seguridad)
10. [Estado Actual del Proyecto](#estado-actual-del-proyecto)
11. [Guías de Desarrollo](#guías-de-desarrollo)

---

## Resumen Ejecutivo

**Sass Store** es una plataforma SaaS multi-tenant diseñada para salones de belleza, spas, centros deportivos y negocios similares. Permite a cada negocio (tenant) tener su propia tienda online con capacidades de e-commerce y sistema de reservas (bookings).

### Características Principales

- **Multi-tenant**: Múltiples negocios independientes en una sola plataforma
- **Modos flexibles**: Catalog (e-commerce), Booking (reservas), o Mixed (ambos)
- **Costos mínimos**: Optimizado para operar con $0-5/mes
- **Type-safe**: 100% TypeScript con Drizzle ORM
- **Seguro**: Row-Level Security (RLS) en PostgreSQL
- **Escalable**: Arquitectura limpia con CQRS y Repository Pattern

### Objetivos del Proyecto

1. Proporcionar una solución completa para negocios de servicios
2. Mantener costos operativos ultra-bajos
3. Garantizar aislamiento total de datos entre tenants
4. Ofrecer una experiencia de usuario (UX) de 10/10
5. Facilitar integración con servicios de pago (Stripe, Mercado Pago)

---

## Estructura del Proyecto

El proyecto está organizado como un **monorepo** utilizando **Turborepo**, lo que permite compartir código entre múltiples aplicaciones y paquetes.

### Arquitectura de Directorios

```
sass-store/
├── apps/                          # Aplicaciones principales
│   ├── web/                       # Frontend Next.js 14 (Puerto 3001)
│   │   ├── app/                   # App Router de Next.js
│   │   │   ├── api/              # API Routes del frontend
│   │   │   ├── t/[tenant]/       # Rutas multi-tenant
│   │   │   ├── auth/             # Autenticación
│   │   │   ├── admin/            # Panel administrativo
│   │   │   ├── finance/          # Módulo financiero
│   │   │   └── profile/          # Perfil de usuario
│   │   ├── components/           # Componentes React
│   │   ├── lib/                  # Utilidades y lógica
│   │   ├── hooks/                # Custom hooks
│   │   └── middleware.ts         # Middleware de tenant resolution
│   └── api/                      # Backend API (Puerto 4000)
│       ├── app/api/              # API Routes del backend
│       ├── graphql/              # Servidor GraphQL
│       └── scripts/              # Scripts de mantenimiento
│
├── packages/                      # Paquetes compartidos
│   ├── database/                 # Esquema Drizzle ORM + conexión
│   ├── ui/                       # Componentes UI compartidos
│   ├── config/                   # Configuración centralizada
│   ├── core/                     # Lógica de negocio y monitoring
│   ├── cache/                    # Sistema de caché
│   └── validation/               # Esquemas Zod
│
├── docs/                         # Documentación técnica
├── tests/                        # Suite de tests
│   ├── e2e/                      # Tests E2E con Playwright
│   ├── unit/                     # Tests unitarios
│   ├── integration/              # Tests de integración
│   └── security/                 # Tests de seguridad
│
├── scripts/                      # Scripts de deployment
├── migrations/                   # Migraciones de base de datos
└── design/                       # Assets de diseño
```

### Apps

#### `apps/web` - Frontend Next.js

La aplicación principal del usuario. Utiliza Next.js 14 con App Router y Server Components.

**Características clave**:

- Server-Side Rendering (SSR)
- Static Site Generation (SSG) donde sea posible
- API Routes para endpoints del frontend
- Middleware para resolución de tenant
- Optimización automática de imágenes

#### `apps/api` - Backend API

Servidor backend con GraphQL y REST endpoints.

**Características clave**:

- Apollo Server para GraphQL
- REST API para integraciones externas
- Scripts de mantenimiento y seed
- Webhooks de servicios externos (Stripe, Mercado Pago)

### Packages

#### `packages/database`

Centraliza el esquema de base de datos y la conexión.

**Contenido**:

- Schema de Drizzle ORM (30+ tablas)
- Migraciones
- Connection pooling
- Tipos TypeScript generados

#### `packages/ui`

Componentes UI reutilizables compartidos entre aplicaciones.

**Componentes incluidos**:

- Botones, inputs, cards
- Modales y diálogos
- Componentes de layout
- Todos con Tailwind CSS

#### `packages/core`

Lógica de negocio compartida.

**Módulos**:

- Business rules
- Monitoring y logging
- Utilidades comunes
- Validaciones

---

## Stack Tecnológico

### Frontend

| Tecnología         | Versión | Propósito                            |
| ------------------ | ------- | ------------------------------------ |
| **Next.js**        | 14.2.33 | Framework React con App Router y SSR |
| **React**          | 18.3.1  | Librería para UI                     |
| **TypeScript**     | 5.2.2   | Tipado estático                      |
| **Tailwind CSS**   | 4.1.14  | Framework CSS utility-first          |
| **Framer Motion**  | 11.18.0 | Animaciones fluidas                  |
| **GSAP**           | 3.13.0  | Animaciones avanzadas (carouseles)   |
| **Zustand**        | 4.4.0   | State management global              |
| **TanStack Query** | 5.90.2  | Data fetching y caché                |

### Backend

| Tecnología             | Versión | Propósito                         |
| ---------------------- | ------- | --------------------------------- |
| **Next.js API Routes** | 14.2.33 | Endpoints REST                    |
| **Apollo Server**      | 5.0     | Servidor GraphQL                  |
| **PostgreSQL**         | 15+     | Base de datos principal           |
| **Drizzle ORM**        | 0.31.0  | ORM type-safe                     |
| **Upstash Redis**      | 1.35.4  | Caché distribuido y rate limiting |

### Autenticación y Pagos

| Tecnología   | Versión       | Propósito                           |
| ------------ | ------------- | ----------------------------------- |
| **NextAuth** | 5.0.0-beta.24 | Autenticación (Credentials + OAuth) |
| **bcryptjs** | 3.0.2         | Hash de contraseñas                 |
| **Stripe**   | 18.5.0        | Procesamiento de pagos              |

### Storage y Assets

| Tecnología     | Versión | Propósito                             |
| -------------- | ------- | ------------------------------------- |
| **AWS S3 SDK** | -       | Storage de medios (compatible con R2) |
| **Sharp**      | -       | Procesamiento de imágenes             |

### Testing

| Tecnología          | Versión | Propósito                          |
| ------------------- | ------- | ---------------------------------- |
| **Playwright**      | 1.40.0  | Tests E2E en múltiples navegadores |
| **Vitest**          | 3.2.4   | Tests unitarios y de integración   |
| **Testing Library** | -       | Testing de componentes React       |

### DevOps

| Tecnología   | Versión | Propósito                  |
| ------------ | ------- | -------------------------- |
| **Turbo**    | 1.10.12 | Build system para monorepo |
| **Husky**    | 9.1.7   | Git hooks                  |
| **ESLint**   | 8.57.0  | Linting de código          |
| **Prettier** | 3.0.0   | Formateo automático        |

---

## Arquitectura del Sistema

### Principios Arquitectónicos

El proyecto sigue los principios de **Clean Architecture** combinados con **CQRS** (Command Query Responsibility Segregation).

```
┌─────────────────────────────────────────┐
│      Presentation Layer                 │  ← Next.js Pages/Components
│      (UI Components, Pages)             │
├─────────────────────────────────────────┤
│      Application Layer                  │  ← Commands/Queries (CQRS)
│      (Use Cases, Business Logic)        │
├─────────────────────────────────────────┤
│      Domain Layer                       │  ← Entities, Value Objects
│      (Core Business Rules)              │
├─────────────────────────────────────────┤
│      Infrastructure Layer               │  ← Database, External APIs
│      (DB Access, 3rd Party Services)    │
└─────────────────────────────────────────┘
```

### Arquitectura Multi-Tenant

La plataforma utiliza un enfoque de **tenant único por base de datos compartida** con aislamiento mediante **Row-Level Security (RLS)**.

#### Estrategia de Resolución de Tenant

Cuando un usuario accede a la aplicación, el sistema determina qué tenant está accediendo mediante el siguiente orden de prioridad:

1. **Header HTTP**: `X-Tenant: wondernails`
2. **Subdomain**: `wondernails.sassstore.com`
3. **Path Parameter**: `/t/wondernails/products`
4. **Query Parameter**: `?tenant=wondernails` (solo desarrollo)
5. **Cookie**: `tenant=wondernails` (solo desarrollo)
6. **Fallback**: `zo-system` (tenant por defecto)

#### Implementación en Middleware

El archivo `apps/web/middleware.ts` intercepta todas las requests y resuelve el tenant:

```typescript
export async function middleware(request: NextRequest) {
  // Resuelve el tenant desde diferentes fuentes
  const resolvedTenant = await resolveTenantStrict(request);

  // Agrega headers con información del tenant
  response.headers.set("x-tenant", resolvedTenant.slug);
  response.headers.set("x-tenant-id", resolvedTenant.id);
  response.headers.set("x-tenant-mode", resolvedTenant.featureMode);

  return response;
}
```

Estos headers están disponibles en:

- Server Components
- API Routes
- Server Actions

### Aislamiento de Datos (Row-Level Security)

Todas las tablas multi-tenant incluyen un campo `tenant_id` y políticas RLS en PostgreSQL.

**Ejemplo de política RLS**:

```sql
-- Tabla de productos
CREATE TABLE products (
    id uuid PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    sku varchar(50) NOT NULL,
    name varchar(200) NOT NULL,
    price decimal(10,2) NOT NULL
);

-- Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Política: solo ver productos de tu tenant
CREATE POLICY tenant_isolation ON products
    FOR ALL TO application_role
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

Antes de cada query, se establece el tenant actual:

```typescript
await db.execute(sql`SET app.current_tenant_id = ${tenantId}`);
```

### Patrones de Diseño

#### 1. Repository Pattern

Abstracción del acceso a datos para facilitar testing y cambios de implementación.

```typescript
// Interface del repositorio
interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  findAll(filters: ProductFilters): Promise<Product[]>;
  create(data: CreateProductData): Promise<Product>;
  update(id: string, data: UpdateProductData): Promise<Product>;
  delete(id: string): Promise<void>;
}

// Implementación con Drizzle
class DrizzleProductRepository implements ProductRepository {
  async findById(id: string) {
    return await db.query.products.findFirst({
      where: eq(products.id, id),
    });
  }
  // ...
}
```

#### 2. Result Pattern

Manejo de errores sin excepciones para control de flujo.

```typescript
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

async function createProduct(data: ProductData): Promise<Result<Product>> {
  try {
    const product = await productRepo.create(data);
    return { ok: true, value: product };
  } catch (error) {
    return { ok: false, error: new Error("Failed to create product") };
  }
}
```

#### 3. CQRS (Command Query Responsibility Segregation)

Separación entre operaciones de lectura (queries) y escritura (commands).

```typescript
// Queries - solo lectura
export async function getProducts(tenantId: string) {
  return await db.query.products.findMany({
    where: eq(products.tenantId, tenantId),
  });
}

// Commands - escritura
export async function createProduct(data: CreateProductData) {
  return await db.insert(products).values(data).returning();
}
```

---

## Funcionalidades Principales

### Modos de Operación por Tenant

Cada tenant puede operar en uno de tres modos:

| Modo        | Descripción            | Características                  |
| ----------- | ---------------------- | -------------------------------- |
| **Catalog** | E-commerce tradicional | Productos, carrito, checkout     |
| **Booking** | Sistema de reservas    | Servicios, calendario, staff     |
| **Mixed**   | Combinación de ambos   | Productos + Servicios + Reservas |

### 1. Sistema Multi-Tenant

#### Características

- **Resolución automática**: Detecta tenant desde URL, header, o subdomain
- **Branding personalizado**: Colores, logo, fuentes por tenant
- **Configuración flexible**: Horarios, ubicación, contacto, redes sociales
- **Aislamiento de datos**: RLS garantiza que cada tenant solo vea sus datos
- **Subdominios**: Soporte para `tenant.sassstore.com`

#### Configuración de Tenant

Cada tenant tiene configuración almacenada en JSONB:

```typescript
interface TenantConfig {
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logo: string;
    font: string;
  };
  business: {
    name: string;
    description: string;
    address: string;
    phone: string;
    email: string;
  };
  hours: {
    monday: { open: string; close: string };
    tuesday: { open: string; close: string };
    // ...
  };
  social: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  };
}
```

### 2. E-Commerce (Catalog Mode)

#### Catálogo de Productos

- **Listado con filtros**: Por categoría, precio, featured, availability
- **Búsqueda en tiempo real**: Typeahead con debounce
- **Imágenes optimizadas**: Lazy loading, WebP/AVIF, blur placeholder
- **SKU único por tenant**: Validación de duplicados
- **Categorización**: Múltiples categorías por producto
- **Variants**: Colores, tamaños, opciones personalizables

#### Carrito de Compras

- **Estado persistente**: Zustand con localStorage
- **Mini-cart flotante**: Acceso rápido desde cualquier página
- **Actualización optimista**: UI reactiva sin esperar servidor
- **Integración con inventario**: Validación de stock en tiempo real
- **Promociones y descuentos**: Códigos promocionales

#### Checkout

- **Flujo optimizado**: Máximo 3 pasos
- **Integración con Stripe**: PaymentIntent API
- **Métodos de pago múltiples**: Tarjeta, transferencia, efectivo
- **Reorder rápido**: 1-click desde historial de órdenes
- **Guest checkout**: Compra sin registrarse

### 3. Sistema de Reservas (Booking Mode)

#### Calendario de Disponibilidad

- **Vista por staff**: Calendario individual de cada empleado
- **Sincronización con Google Calendar**: Bidireccional
- **Detección de conflictos**: Previene doble booking
- **Slots configurables**: Duración personalizable (15, 30, 60 min)
- **Bloqueos de tiempo**: Para breaks, almuerzos, eventos

#### Gestión de Servicios

- **Servicios con duración**: Tiempo estimado por servicio
- **Precios dinámicos**: Por servicio, staff, horario
- **Asignación de staff**: Servicios solo ofrecidos por personal capacitado
- **Categorías de servicios**: Manicure, pedicure, masajes, etc.
- **Add-ons**: Servicios complementarios

#### Staff Management

- **Perfiles de empleados**: Foto, bio, especialidades
- **Horarios personalizados**: Días y horas de trabajo
- **Calendario personal**: Vista individual de bookings
- **Comisiones**: Tracking de ingresos por empleado
- **Ratings y reviews**: Feedback de clientes

### 4. Autenticación y Autorización

#### Métodos de Login

1. **Credentials (Email + Password)**
   - Hash con bcrypt (10 rounds)
   - Validación contra tabla `users`
   - Token JWT con expiración de 14 días

2. **Google OAuth**
   - Flujo OAuth 2.0 estándar
   - Creación automática de usuario
   - Sincronización de perfil y avatar

3. **API Keys** (para integraciones)
   - SHA-256 hash del key
   - Prefix visible (primeros 8 caracteres)
   - Permisos granulares (array JSONB)
   - Expiración configurable
   - Last used tracking

#### Sistema de Roles (RBAC)

| Rol          | Permisos          | Descripción                                        |
| ------------ | ----------------- | -------------------------------------------------- |
| **Admin**    | Acceso total      | Dueño del negocio, configuración completa          |
| **Gerente**  | Gestión operativa | Reportes, inventario, staff (sin cambios críticos) |
| **Personal** | Acceso limitado   | Ver calendario, marcar bookings, ver clientes      |
| **Cliente**  | Usuario final     | Comprar, reservar, ver historial                   |

#### Configuración de NextAuth

```typescript
// apps/web/auth.config.ts
export const authConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      authorize: async (credentials) => {
        const user = await verifyUser(credentials.email, credentials.password);
        return user || null;
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 14 * 24 * 60 * 60, // 14 días
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.tenantSlug = user.tenantSlug;
      }
      return token;
    },
    session: async ({ session, token }) => {
      session.user.role = token.role;
      session.user.tenantSlug = token.tenantSlug;
      return session;
    },
  },
};
```

### 5. Panel Administrativo

#### Dashboard Financiero

- **KPIs en tiempo real**:
  - Ventas del día/semana/mes
  - Tasa de conversión
  - Ticket promedio
  - Productos más vendidos

- **Gráficos interactivos**:
  - Evolución de ventas (Chart.js)
  - Distribución por categoría
  - Análisis de clientes

- **Reconciliación bancaria**:
  - Importación de movimientos
  - Match automático con órdenes
  - Detección de discrepancias

#### Point of Sale (POS)

- **Venta rápida**: Interfaz optimizada para touch
- **Múltiples terminales**: Soporte para varios dispositivos
- **Integración con impresora**: Tickets físicos
- **Métodos de pago**: Efectivo, tarjeta, transferencia
- **Búsqueda de productos**: Por SKU, código de barras, nombre

#### Gestión de Inventario

- **CRUD de productos/servicios**
- **Importación masiva**: CSV/Excel
- **Gestión de imágenes**: Upload a R2/S3
- **Control de stock**: Alertas de bajo inventario
- **Categorización**: Múltiples niveles

#### Reportes

- **Ventas por período**: Día, semana, mes, año
- **Análisis de productos**: Más vendidos, menos vendidos, rentabilidad
- **Análisis de clientes**: RFM (Recency, Frequency, Monetary)
- **Reportes de staff**: Comisiones, performance
- **Exportación**: CSV, Excel, PDF

### 6. Social Planner (Módulo de Marketing)

- **Calendario editorial**: Planificación de contenido
- **Integración con redes sociales**: Instagram, Facebook, TikTok
- **Biblioteca de contenido**: Imágenes, videos, templates
- **Programación de posts**: Publicación automática
- **Analytics**: Métricas de engagement

### 7. Command Palette (UX Feature)

Búsqueda global estilo Spotlight/Cmd+K.

**Características**:

- Activación: `Cmd+K` (Mac) / `Ctrl+K` (Windows)
- Búsqueda fuzzy de:
  - Productos
  - Servicios
  - Clientes
  - Órdenes
  - Acciones (crear producto, nueva reserva, etc.)
- Navegación por teclado
- Contexto por tenant

### 8. Quick Actions Dock

Toolbar flotante con acciones contextuales según el rol del usuario.

**Admin**:

- Crear producto
- Nueva reserva
- Ver reportes
- Configuración

**Personal**:

- Ver calendario
- Marcar asistencia
- Ver clientes del día

**Cliente**:

- Hacer pedido
- Reservar servicio
- Ver historial

---

## Base de Datos y Autenticación

### Proveedor de Base de Datos

**PostgreSQL 15+** con soporte para:

- Row-Level Security (RLS)
- JSONB para datos flexibles
- Full-text search
- Triggers y funciones

### Opciones de Deployment

#### 1. Neon (Recomendado)

**Free Tier**:

- 3 GB storage
- 192 horas compute/mes
- Autoscaling automático
- Scale-to-zero (5 min inactividad)
- Connection pooling incluido

**Ventajas**:

- Serverless (paga solo por uso)
- Branching para desarrollo
- Point-in-time recovery
- Compatible con Vercel/Cloudflare

#### 2. Supabase (Alternativa)

**Free Tier**:

- 500 MB storage
- Unlimited API requests
- Row-Level Security nativo
- Realtime subscriptions
- Auth integrado

**Ventajas**:

- Realtime capabilities
- Storage incluido
- Edge Functions
- Admin dashboard

#### 3. Local Development

Docker Compose incluido en el proyecto:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: sass_store
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

### Esquema de Base de Datos

**30+ tablas** organizadas en módulos:

#### Core Tables

```sql
-- Tenants
tenants (id, slug, name, config, feature_mode, created_at, updated_at)

-- Users
users (id, email, password_hash, name, avatar, created_at, updated_at)

-- User Roles (multi-tenant)
user_roles (id, user_id, tenant_id, role, permissions, created_at)
```

#### Catalog Module

```sql
-- Products
products (id, tenant_id, sku, name, description, price, stock, images, category_id)

-- Categories
categories (id, tenant_id, name, slug, parent_id)

-- Product Variants
product_variants (id, product_id, name, sku, price_delta, stock)
```

#### Booking Module

```sql
-- Services
services (id, tenant_id, name, description, duration_minutes, price, category_id)

-- Bookings
bookings (id, tenant_id, service_id, customer_id, staff_id, start_time, end_time, status)

-- Staff
staff (id, tenant_id, user_id, specialties, schedule, is_active)
```

#### Orders & Payments

```sql
-- Orders
orders (id, tenant_id, customer_id, total, status, payment_status, created_at)

-- Order Items
order_items (id, order_id, product_id, quantity, unit_price, subtotal)

-- Payments
payments (id, order_id, amount, method, provider, provider_transaction_id, status)
```

#### Auth & Security

```sql
-- API Keys
api_keys (id, tenant_id, name, key_hash, prefix, permissions, expires_at, last_used_at)

-- Audit Logs
audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, changes, created_at)
```

### ORM: Drizzle

**Ventajas de Drizzle**:

- Type-safe queries
- SQL-like syntax
- Push directo a DB (sin migraciones en desarrollo)
- Compatible con edge runtimes
- Ligero (~10KB)

**Ejemplo de uso**:

```typescript
// Definición del schema
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  sku: varchar("sku", { length: 50 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Query type-safe
const productsList = await db.query.products.findMany({
  where: eq(products.tenantId, tenantId),
  orderBy: [desc(products.createdAt)],
  limit: 20,
});
```

### Caché Layer: Upstash Redis

**Free Tier**:

- 10,000 commands/día
- 256 MB storage
- Global replication

**Usos**:

- Rate limiting por tenant/IP
- Session storage
- Query result caching
- Real-time counters (stock, views)

**Ejemplo**:

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Cache de productos
const cacheKey = `products:${tenantId}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return cached;
}

const products = await db.query.products.findMany({ ... });
await redis.setex(cacheKey, 300, products); // 5 min TTL

return products;
```

---

## API y Rutas

### Estructura de Rutas Frontend

#### Rutas Públicas

```
/                              → Landing page
/api/health                    → Health check
/api/csrf-token                → Token CSRF para formularios
```

#### Rutas Multi-Tenant (`/t/[tenant]`)

**Storefront**:

```
/t/[tenant]                    → Homepage del tenant
/t/[tenant]/products           → Catálogo de productos
/t/[tenant]/products/[id]      → Detalle de producto
/t/[tenant]/services           → Servicios disponibles
/t/[tenant]/cart               → Carrito de compras
/t/[tenant]/checkout           → Proceso de pago
```

**Booking**:

```
/t/[tenant]/booking            → Sistema de reservas
/t/[tenant]/booking/calendar   → Calendario de disponibilidad
/t/[tenant]/orders             → Historial de órdenes
```

**User Area**:

```
/t/[tenant]/login              → Login
/t/[tenant]/register           → Registro
/t/[tenant]/profile            → Perfil de usuario
/t/[tenant]/profile/settings   → Configuración
```

**Admin Panel**:

```
/t/[tenant]/admin              → Dashboard admin
/t/[tenant]/admin/products     → Gestión de productos
/t/[tenant]/admin/services     → Gestión de servicios
/t/[tenant]/admin/calendar     → Calendario de reservas
/t/[tenant]/admin/customers    → Gestión de clientes
/t/[tenant]/finance            → Dashboard financiero
/t/[tenant]/pos                → Point of Sale
/t/[tenant]/reports            → Reportes
/t/[tenant]/social             → Social media planner
```

### API Endpoints Frontend (`apps/web/app/api`)

#### Autenticación

```
POST /api/auth/login               → Login con credentials
POST /api/auth/register            → Registro de usuario
POST /api/auth/forgot-password     → Recuperar contraseña
POST /api/auth/reset-password      → Reset de contraseña
GET  /api/auth/tenant-access       → Verificar acceso a tenant
GET  /api/auth/[...nextauth]       → Handlers de NextAuth
```

#### Productos y Servicios

```
GET    /api/products               → Listar productos (con filtros)
POST   /api/products               → Crear producto (admin)
PUT    /api/products/[id]          → Actualizar producto
DELETE /api/products/[id]          → Eliminar producto
GET    /api/services               → Listar servicios
POST   /api/services               → Crear servicio
```

#### Órdenes

```
GET    /api/orders                 → Historial de órdenes del usuario
POST   /api/orders                 → Crear nueva orden
GET    /api/orders/[id]            → Detalle de orden
PUT    /api/orders/[id]/status     → Actualizar estado
```

#### Pagos (Stripe)

```
POST   /api/payments/create-intent     → Crear PaymentIntent
POST   /api/payments/webhook           → Webhook de Stripe (events)
GET    /api/payments/health            → Estado del servicio de pagos
```

#### Perfil de Usuario

```
GET    /api/profile                → Obtener perfil completo
PUT    /api/profile                → Actualizar perfil
PUT    /api/profile/password       → Cambiar contraseña
PUT    /api/profile/role           → Actualizar rol (admin)
POST   /api/profile/avatar         → Subir avatar
```

#### Tenants

```
GET    /api/tenants/[slug]         → Información pública del tenant
PUT    /api/tenants/[slug]/config  → Actualizar configuración (admin)
```

### API Endpoints Backend (`apps/api/app/api`)

#### GraphQL

```
POST   /api/graphql                → Servidor Apollo GraphQL
```

**Schema principal**:

```graphql
type Query {
  # Tenants
  tenant(slug: String!): Tenant

  # Products
  products(tenantId: ID!, filters: ProductFilters): [Product!]!
  product(id: ID!): Product

  # Services
  services(tenantId: ID!): [Service!]!
  service(id: ID!): Service

  # Bookings
  bookings(tenantId: ID!, filters: BookingFilters): [Booking!]!
  booking(id: ID!): Booking

  # Orders
  orders(tenantId: ID!, userId: ID!): [Order!]!
  order(id: ID!): Order
}

type Mutation {
  # Products
  createProduct(input: ProductInput!): Product!
  updateProduct(id: ID!, input: ProductInput!): Product!
  deleteProduct(id: ID!): Boolean!

  # Bookings
  createBooking(input: BookingInput!): Booking!
  cancelBooking(id: ID!): Booking!

  # Orders
  createOrder(input: OrderInput!): Order!
  updateOrderStatus(id: ID!, status: OrderStatus!): Order!
}
```

#### Finance Module

```
GET    /api/finance/kpis                          → KPIs financieros
GET    /api/finance/movements                     → Movimientos bancarios
POST   /api/finance/movements/[id]/reconcile      → Reconciliar movimiento
GET    /api/finance/pos/sales                     → Ventas POS
GET    /api/finance/pos/terminals                 → Terminales POS
GET    /api/finance/reports/sales                 → Reporte de ventas
GET    /api/finance/reports/products              → Reporte de productos
GET    /api/finance/config                        → Configuración financiera
```

#### Mercado Pago Integration

```
POST   /api/mercadopago/connect       → Conectar cuenta de MP
POST   /api/mercadopago/payments      → Crear preferencia de pago
GET    /api/mercadopago/callback      → Callback OAuth
POST   /api/mercadopago/webhook       → Webhook de notificaciones
```

#### Media Upload (S3/R2)

```
POST   /api/v1/media/upload           → Subir asset multimedia
DELETE /api/v1/media/[id]             → Eliminar media
```

**Soporta**:

- Imágenes (JPEG, PNG, WebP)
- Videos (MP4, MOV)
- Documentos (PDF)
- Resize automático
- Generación de thumbnails

#### Public API v1 (Con autenticación API Key)

```
GET    /api/v1/products               → Listar productos
POST   /api/v1/products               → Crear producto
GET    /api/v1/products/[id]          → Obtener producto
PUT    /api/v1/products/[id]          → Actualizar producto
DELETE /api/v1/products/[id]          → Eliminar producto

GET    /api/v1/services               → Listar servicios
POST   /api/v1/services               → Crear servicio

GET    /api/v1/public/products        → Productos públicos (sin auth)
```

**Autenticación con API Key**:

```bash
curl -H "X-API-Key: sk_live_abc123..." \
     https://api.sassstore.com/api/v1/products
```

#### Monitoring

```
GET    /api/health                    → Health check (status de servicios)
GET    /api/metrics                   → Métricas Prometheus
```

---

## Deployment e Infraestructura

### Objetivo: $0-5/mes

El proyecto está diseñado para funcionar con costos operativos ultra-bajos utilizando free tiers de servicios cloud.

### Stack de Deployment

| Servicio           | Proveedor          | Costo | Uso                    |
| ------------------ | ------------------ | ----- | ---------------------- |
| **Frontend & API** | Cloudflare Pages   | $0    | Hosting + CDN          |
| **Database**       | Neon PostgreSQL    | $0    | 3GB + 192h compute/mes |
| **Cache**          | Upstash Redis      | $0    | 10K commands/día       |
| **Storage**        | Cloudflare R2      | $0    | 10GB storage           |
| **Monitoring**     | Cloudflare Workers | $0    | 100K req/día           |
| **Email**          | Resend             | $0    | 100 emails/día         |

**Total**: $0/mes con límites generosos

### Cloudflare Pages

**Free Tier**:

- 500 builds/mes
- Bandwidth ilimitado
- DDoS protection incluido
- Custom domains
- Preview deployments por PR

**Configuración**:

```bash
# Build para Cloudflare Pages
npm run build:cloudflare

# Deploy manual
npx wrangler pages deploy out
```

**wrangler.toml**:

```toml
name = "sass-store"
compatibility_date = "2024-01-01"

[site]
bucket = "./out"

[[routes]]
pattern = "*"
custom_domain = true
```

### Neon PostgreSQL

**Free Tier**:

- 3 GB storage
- 192 horas de compute/mes (~6.4 horas/día)
- Autoscaling automático
- Scale-to-zero después de 5 minutos de inactividad

**Ventajas**:

- Branching (bases de datos por PR)
- Point-in-time recovery
- Connection pooling incluido

**Conexión**:

```bash
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/sass_store?sslmode=require
```

### Upstash Redis

**Free Tier**:

- 10,000 commands/día
- 256 MB storage
- Global replication

**Uso principal**:

- Rate limiting
- Session storage
- Cache de queries frecuentes

### Cloudflare R2 (Storage)

Compatible con S3 API.

**Free Tier**:

- 10 GB storage
- Sin egress fees (descarga gratis)

**Uso**:

- Imágenes de productos
- Avatares de usuarios
- Assets de marketing

**Configuración**:

```typescript
import { S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});
```

### Monitoreo de Costos

Cloudflare Worker que ejecuta diariamente:

**Budget Thresholds**:

- **50%** → Eco Mode (reduce calidad de imágenes, caché agresivo)
- **80%** → Warning alerts (email/Slack)
- **90%** → Freeze Mode (solo lectura)
- **100%** → Kill Switch (maintenance mode)

**Implementación**:

```typescript
// Revisa costos de:
// - Neon (compute hours)
// - Upstash (commands)
// - R2 (storage + requests)
// Compara con budget mensual ($5)
// Envía alertas si supera thresholds
```

### CI/CD con GitHub Actions

**`.github/workflows/deploy.yml`**:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:ci

      - name: Build
        run: npm run build:cloudflare

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: sass-store
          directory: out
```

### Custom Domains

**Cloudflare DNS**:

```
sassstore.com           → CNAME to sass-store.pages.dev
*.sassstore.com         → CNAME to sass-store.pages.dev (wildcard)
```

Esto permite:

- `wondernails.sassstore.com`
- `vigistudio.sassstore.com`
- etc.

---

## Seguridad

### Implementaciones de Seguridad

#### 1. Row-Level Security (RLS)

Todas las tablas multi-tenant tienen políticas RLS en PostgreSQL.

**Ejemplo**:

```sql
-- Política para productos
CREATE POLICY tenant_isolation_products ON products
    FOR ALL TO application_role
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

Antes de cada query:

```typescript
await db.execute(sql`SET app.current_tenant_id = ${tenantId}`);
```

#### 2. CSRF Protection

Token único por sesión validado en todos los endpoints de modificación.

**Generación**:

```typescript
// apps/web/app/api/csrf-token/route.ts
export async function GET() {
  const token = generateCSRFToken();

  cookies().set("csrf-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return { token };
}
```

**Validación**:

```typescript
export async function POST(req: Request) {
  const csrfToken = req.headers.get("X-CSRF-Token");
  const cookieToken = cookies().get("csrf-token")?.value;

  if (!csrfToken || csrfToken !== cookieToken) {
    return new Response("Invalid CSRF token", { status: 403 });
  }

  // Procesar request...
}
```

#### 3. Content Security Policy (CSP)

Headers de seguridad configurados en `next.config.js`:

```javascript
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https: blob:;
      font-src 'self' data:;
      connect-src 'self' https://api.stripe.com https://*.upstash.io;
      frame-src https://js.stripe.com;
    `
      .replace(/\s{2,}/g, " ")
      .trim(),
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];
```

#### 4. Rate Limiting

Implementado con Upstash Redis.

**Por tenant**:

```typescript
const rateLimitKey = `ratelimit:${tenantId}:${endpoint}`;
const current = await redis.incr(rateLimitKey);

if (current === 1) {
  await redis.expire(rateLimitKey, 60); // 1 minuto
}

if (current > 100) {
  return new Response("Rate limit exceeded", { status: 429 });
}
```

**Por IP (endpoints públicos)**:

```typescript
const ip = req.headers.get("x-forwarded-for") || "unknown";
const rateLimitKey = `ratelimit:ip:${ip}:${endpoint}`;
// Similar logic...
```

#### 5. API Key Security

**Generación**:

```typescript
function generateApiKey() {
  const key = `sk_${mode}_${randomBytes(32).toString("hex")}`;
  const hash = createHash("sha256").update(key).digest("hex");
  const prefix = key.slice(0, 12); // Primeros 12 chars visibles

  await db.insert(apiKeys).values({
    keyHash: hash,
    prefix: prefix,
    permissions: ["products:read", "orders:write"],
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
  });

  return key; // Solo se muestra una vez
}
```

**Validación**:

```typescript
const apiKey = req.headers.get("X-API-Key");
const hash = createHash("sha256").update(apiKey).digest("hex");

const keyRecord = await db.query.apiKeys.findFirst({
  where: eq(apiKeys.keyHash, hash),
});

if (!keyRecord || keyRecord.expiresAt < new Date()) {
  return new Response("Invalid API key", { status: 401 });
}

// Actualizar last used
await db
  .update(apiKeys)
  .set({ lastUsedAt: new Date() })
  .where(eq(apiKeys.id, keyRecord.id));
```

#### 6. Password Security

**Hash**:

```typescript
import bcrypt from "bcryptjs";

const hashedPassword = await bcrypt.hash(password, 10);
```

**Verificación**:

```typescript
const isValid = await bcrypt.compare(password, user.passwordHash);
```

**Validación de complejidad**:

```typescript
const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .regex(/[A-Z]/, "Debe contener mayúscula")
  .regex(/[a-z]/, "Debe contener minúscula")
  .regex(/[0-9]/, "Debe contener número")
  .regex(/[^A-Za-z0-9]/, "Debe contener carácter especial");
```

#### 7. Auditoría y Logging

Todas las operaciones críticas se registran en `audit_logs`:

```typescript
await db.insert(auditLogs).values({
  tenantId,
  userId,
  action: "product.delete",
  entityType: "product",
  entityId: productId,
  changes: {
    before: oldProduct,
    after: null,
  },
  ipAddress: req.headers.get("x-forwarded-for"),
  userAgent: req.headers.get("user-agent"),
});
```

### Vulnerabilidades Conocidas

**Pendientes de resolución**:

1. **Server Actions sin verificación de sesión** (8 instancias)
   - Ubicación: `apps/web/app/actions/`
   - Fix: Agregar `verifySession()` en todas las acciones

2. **Validación de input en formularios**
   - Algunos formularios carecen de validación Zod completa
   - Fix: Implementar esquemas de validación uniformes

**Próximos pasos**:

- Auditoría de seguridad completa antes de producción
- Penetration testing
- Code review de seguridad

---

## Estado Actual del Proyecto

### Completado (100%)

#### Build y Deployment

- ✅ Errores críticos de build resueltos
- ✅ Apollo Server configurado correctamente
- ✅ Todas las dependencias instaladas
- ✅ Build local exitoso (21.28 segundos)
- ✅ Deployment a Cloudflare configurado
- ✅ Cache invalidation en Cloudflare

#### Type Safety

- ✅ 30+ tipos `any` eliminados
- ✅ Tipos creados: `tenant.ts`, `reports.ts`, `finance.ts`
- ✅ Type-safety en componentes críticos
- ✅ Drizzle ORM completamente tipado

#### Testing Infrastructure

- ✅ Vitest configurado
- ✅ Playwright configurado (5 navegadores)
- ✅ 21 tests pasando
- ✅ Tests críticos implementados:
  - Booking operations (7 tests)
  - Payment operations (6 tests)
  - Cart operations (13 tests)
  - RLS security (9 tests)

#### Performance

- ✅ Apollo Client removido del frontend (-150KB)
- ✅ Lazy loading implementado en componentes pesados
- ✅ Bundle size optimizado
- ✅ Imágenes con loading="lazy" y blur placeholders

#### Code Quality

- ✅ ESLint configurado con reglas estrictas
- ✅ Prettier configurado
- ✅ DisplayName agregado a todos los componentes
- ✅ Dependencies limpiadas (devDependencies correctas)

#### Documentación

- ✅ README completo
- ✅ DEPLOYMENT.md
- ✅ ARCHITECTURE.md
- ✅ PROJECT_STATUS.md
- ✅ Múltiples guías técnicas en `/docs`

### En Progreso (70%)

#### Performance Adicional

- ⏳ Bundle analyzer completo (pendiente análisis profundo)
- ⏳ React Suspense en más layouts
- ⏳ Virtual scrolling en listados largos

#### Formularios

- ⏳ Migrar a componentes reutilizables (4 archivos pendientes)
- ⏳ Validación uniforme con Zod

### Pendiente (0%)

#### Test Coverage

- ❌ Aumentar coverage >80% (requiere DATABASE_URL en CI)
- ❌ E2E tests adicionales (calendar, POS, social planner)
- ❌ Performance tests (Lighthouse CI)

#### UX/UI

- ❌ Optimistic updates en más acciones
- ❌ Skeleton loaders consistentes
- ❌ Page transitions con Framer Motion

#### Monitoring

- ❌ Error tracking (Sentry o similar)
- ❌ Performance monitoring (Vercel Analytics o similar)
- ❌ User analytics (Posthog o similar)

### Métricas del Proyecto

| Métrica                 | Valor                     |
| ----------------------- | ------------------------- |
| **Líneas de código**    | ~50,000                   |
| **Archivos TypeScript** | 200+                      |
| **Componentes React**   | 150+                      |
| **Tablas de BD**        | 30+                       |
| **Endpoints API**       | 50+                       |
| **Tests**               | 35 (21 pasando)           |
| **Coverage**            | ~40% (objetivo: 80%)      |
| **Bundle size**         | ~800KB (objetivo: <500KB) |
| **Lighthouse Score**    | 85/100 (objetivo: 95/100) |

---

## Guías de Desarrollo

### Setup Local

#### Prerequisitos

- **Node.js**: 18 o superior
- **npm**: 9 o superior
- **Docker**: Para PostgreSQL y Redis (opcional)
- **Git**: Para control de versiones

#### Instalación

1. **Clonar repositorio**:

```bash
git clone https://github.com/tu-org/sass-store.git
cd sass-store
```

2. **Instalar dependencias**:

```bash
npm install
```

3. **Configurar variables de entorno**:

```bash
# Copiar template
cp .env.example .env

# Editar con tus credenciales
code .env
```

**Mínimo requerido en `.env`**:

```bash
# Database (usa Neon free tier o local)
DATABASE_URL=postgresql://user:pass@host:5432/sass_store

# NextAuth
NEXTAUTH_SECRET=genera-con-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3001

# Stripe (test keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

4. **Levantar servicios (si usas Docker)**:

```bash
docker-compose up -d
```

5. **Push schema a la base de datos**:

```bash
npm run db:push
```

6. **Seed data inicial**:

```bash
cd apps/api
npm run db:seed
```

Esto creará:

- 7 tenants de ejemplo
- Usuarios admin para cada tenant
- Productos y servicios de muestra

7. **Iniciar desarrollo**:

```bash
npm run dev
```

**URLs disponibles**:

- Frontend: http://localhost:3001
- API Backend: http://localhost:4000
- GraphQL Playground: http://localhost:4000/api/graphql

**Tenants de prueba**:

- http://localhost:3001/t/wondernails (booking mode)
- http://localhost:3001/t/vigistudio (booking mode)
- http://localhost:3001/t/vainilla-vargas (catalog mode)
- http://localhost:3001/t/zo-system (mixed mode)

**Credenciales de admin**:

```
Email: admin@[tenant-slug].com
Password: admin123
```

### Comandos de Desarrollo

#### Build y Linting

```bash
# Build de todo el monorepo
npm run build

# Build solo del frontend
npm run build:web

# Build para Cloudflare Pages
npm run build:cloudflare

# Linting
npm run lint

# Fix automático
npm run lint:fix

# Format con Prettier
npm run format

# Type checking
npm run typecheck
```

#### Base de Datos

```bash
# Push schema (desarrollo)
npm run db:push

# Generar migración
npm run db:generate

# Aplicar migraciones (producción)
npm run db:migrate

# Introspect DB existente
npm run db:introspect

# Seed data
npm run db:seed

# Reset completo (¡cuidado!)
npm run db:reset
```

#### Testing

```bash
# Tests unitarios
npm run test:unit

# Watch mode
npm run test:watch

# UI interactiva (Vitest UI)
npm run test:ui

# Coverage
npm run test:coverage

# Tests E2E
npm run test:e2e

# E2E headed (ver navegador)
npm run test:e2e:headed

# E2E debug
npm run test:e2e:debug

# Ver reporte E2E
npm run test:e2e:report
```

#### Turbo (Monorepo)

```bash
# Build incremental (solo cambios)
npx turbo build

# Limpiar cache de Turbo
npx turbo clean

# Ver dependency graph
npx turbo graph
```

### Estructura de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add product filtering by category
fix: resolve cart total calculation bug
docs: update deployment guide
style: format code with prettier
refactor: extract cart logic to custom hook
test: add tests for booking cancellation
chore: update dependencies
```

**Tipos válidos**:

- `feat`: Nueva funcionalidad
- `fix`: Bug fix
- `docs`: Documentación
- `style`: Formateo, no afecta lógica
- `refactor`: Refactorización
- `test`: Tests
- `chore`: Mantenimiento, configs

### Workflow de Desarrollo

1. **Crear rama** desde `main`:

```bash
git checkout -b feature/product-filters
```

2. **Hacer cambios** y commits frecuentes:

```bash
git add .
git commit -m "feat: add category filter"
```

3. **Ejecutar tests** antes de push:

```bash
npm run test:unit
npm run lint
```

4. **Push** a GitHub:

```bash
git push origin feature/product-filters
```

5. **Crear Pull Request** en GitHub:
   - Descripción clara de cambios
   - Screenshots si hay cambios visuales
   - Marcar reviewers

6. **CI** ejecutará automáticamente:
   - Linting
   - Type checking
   - Tests
   - Build

7. **Merge** después de aprobación y checks pasados

### Tenants de Ejemplo

| Tenant           | Slug               | Modo    | Usuario Admin              |
| ---------------- | ------------------ | ------- | -------------------------- |
| Wonder Nails     | `wondernails`      | booking | admin@wondernails.com      |
| Vigi Studio      | `vigistudio`       | booking | admin@vigistudio.com       |
| Centro Tenístico | `centro-tenistico` | booking | admin@centro-tenistico.com |
| Vainilla Vargas  | `vainilla-vargas`  | catalog | admin@vainilla-vargas.com  |
| Delirios         | `delirios`         | catalog | admin@delirios.com         |
| Nom Nom          | `nom-nom`          | catalog | admin@nom-nom.com          |
| Zo System        | `zo-system`        | mixed   | admin@zo-system.com        |

**Contraseña**: `admin123` (todos los usuarios)

### Debugging

#### VS Code

Configuración en `.vscode/launch.json`:

```json
{
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3001"
    }
  ]
}
```

#### Logs

```typescript
// Usar logger centralizado
import { logger } from "@/lib/logger";

logger.info("User logged in", { userId, tenantId });
logger.error("Failed to create order", { error, orderId });
logger.debug("Cache hit", { key, ttl });
```

#### DevTools

- **React DevTools**: Inspeccionar componentes
- **Redux DevTools**: Ver estado de Zustand (con middleware)
- **Apollo DevTools**: Queries y cache de GraphQL

### Deployment

#### Preview (staging)

```bash
# Deploy automático en cada PR
# URL: https://[pr-number].sass-store.pages.dev
```

#### Production

```bash
# Build
npm run build:cloudflare

# Deploy manual
npx wrangler pages deploy out

# O push a main (deploy automático vía GitHub Actions)
git push origin main
```

### Troubleshooting

#### Error: "Database connection failed"

```bash
# Verificar que DATABASE_URL esté en .env
echo $DATABASE_URL

# Verificar conectividad
psql $DATABASE_URL -c "SELECT 1;"

# Si usas Docker, verificar que el contenedor esté corriendo
docker ps
```

#### Error: "Module not found"

```bash
# Limpiar node_modules
rm -rf node_modules apps/*/node_modules packages/*/node_modules

# Reinstalar
npm install

# Limpiar cache de Turbo
npx turbo clean
```

#### Build falla en Cloudflare

```bash
# Verificar que next.config.js tenga output: 'export'
# Verificar que no haya Server Components incompatibles con SSG
# Revisar logs en Cloudflare Dashboard
```

---

## Recursos Adicionales

### Documentación en `/docs`

- **ARCHITECTURE.md**: Arquitectura detallada del sistema
- **TESTING.md**: Estrategia de testing y guías
- **DEPLOYMENT.md**: Guía completa de deployment
- **SECURITY_ANALYSIS_2025.md**: Auditoría de seguridad
- **PERFORMANCE_AUDIT_2025-11-07.md**: Auditoría de performance
- **E2E_TESTING_GUIDE.md**: Guía de tests E2E con Playwright

### Enlaces Útiles

- **Next.js Docs**: https://nextjs.org/docs
- **Drizzle ORM**: https://orm.drizzle.team/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Stripe API**: https://stripe.com/docs/api
- **Cloudflare Pages**: https://developers.cloudflare.com/pages/
- **Neon Database**: https://neon.tech/docs
- **Upstash Redis**: https://docs.upstash.com/redis

### Contacto

Para preguntas o soporte:

- **GitHub Issues**: https://github.com/tu-org/sass-store/issues
- **Documentación**: Consultar `/docs`
- **Email**: dev@sassstore.com

---

## Conclusión

**Sass Store** es una plataforma SaaS multi-tenant moderna, segura y escalable, diseñada para negocios de servicios como salones de belleza, spas y centros deportivos.

### Fortalezas

✅ **Arquitectura sólida**: Clean Architecture + CQRS
✅ **Seguridad robusta**: RLS, CSRF, CSP, rate limiting
✅ **Type-safety**: 100% TypeScript con Drizzle ORM
✅ **Performance**: Optimizaciones de bundle, lazy loading, caché
✅ **Costos mínimos**: $0-5/mes con free tiers
✅ **Documentación exhaustiva**: Múltiples guías y READMEs
✅ **Testing**: Infrastructure lista con Vitest y Playwright

### Áreas de Mejora

🔧 Aumentar cobertura de tests (objetivo: 80%)
🔧 Resolver vulnerabilidades de seguridad pendientes
🔧 Optimizaciones adicionales de bundle (objetivo: <500KB)
🔧 Implementar monitoring de producción
🔧 Migrar formularios a componentes reutilizables

### Estado General

El proyecto está **funcional y deployable**, listo para desarrollo continuo y refinamiento antes del lanzamiento a producción final. La base es sólida y escalable para crecer con las necesidades del negocio.

---

**Última actualización**: 2025-01-13
**Versión del documento**: 1.0
**Mantenedores**: Equipo Sass Store
