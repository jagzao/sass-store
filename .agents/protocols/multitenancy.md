# Protocolo de Multitenancy

> **Versión:** 1.0.0  
> **Última actualización:** 2026-03-02  
> **Proyecto:** sass-store  

---

## Propósito

Este protocolo define las reglas inquebrantables para garantizar el aislamiento de datos entre tenants en sass-store.

---

## 1. Principios Fundamentales

### 1.1 Reglas de Oro

```
┌─────────────────────────────────────────────────────────────────┐
│                    REGLAS DE ORO MULTITENANT                    │
├─────────────────────────────────────────────────────────────────┤
│ 1. NUNCA mezclar datos entre tenants                            │
│ 2. SIEMPRE filtrar por tenantId en queries                      │
│ 3. SIEMPRE validar tenant del contexto autenticado              │
│ 4. NUNCA confiar en tenantId del cliente                        │
│ 5. SIEMPRE aplicar RLS en tablas tenant-scoped                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Modelo de Datos

**Tablas Tenant-Scoped (requieren tenant_id):**
- `products`
- `services`
- `bookings`
- `customers`
- `campaigns`
- `social_posts`
- `orders`
- `quotes`
- `invoices`
- `pos_terminals`

**Tablas Globales (sin tenant_id):**
- `tenants`
- `users` (pero con relación en `user_roles`)
- `audit_logs` (con tenant_id para filtrado)

---

## 2. Resolución de Tenant

### 2.1 Fuentes de Tenant Context

```typescript
// Orden de prioridad para resolver tenant
type TenantSource = 
  | 'slug'      // /t/[slug]/... 
  | 'header'    // X-Tenant-ID header
  | 'jwt'       // JWT token
  | 'session';  // Session user

// Función de resolución
const resolveTenant = async (context: RequestContext): Promise<Result<string, DomainError>> => {
  // 1. Intentar desde slug de URL
  if (context.params?.slug) {
    return getTenantBySlug(context.params.slug);
  }
  
  // 2. Intentar desde header
  if (context.headers['x-tenant-id']) {
    return validateTenantExists(context.headers['x-tenant-id']);
  }
  
  // 3. Intentar desde JWT/session
  if (context.user?.tenantId) {
    return Ok(context.user.tenantId);
  }
  
  return Err(ErrorFactories.notFound('Tenant', 'context'));
};
```

### 2.2 Middleware de Tenant

```typescript
// apps/web/middleware.ts - Extracto
export const withTenantContext = async (
  request: NextRequest,
  handler: (request: NextRequest, context: TenantContext) => Promise<Response>
): Promise<Response> => {
  const tenantResult = await resolveTenant(request);
  
  return match(tenantResult, {
    ok: (tenantId) => handler(request, { tenantId, ... }),
    err: (error) => NextResponse.json(
      { success: false, error: error.message },
      { status: 404 }
    )
  });
};
```

---

## 3. Queries Seguras

### 3.1 Patrones Correctos

```typescript
// ✅ CORRECTO: Query con filtro tenantId
const getProducts = async (tenantId: string): Promise<Result<Product[], DomainError>> => {
  return fromPromise(
    db.products.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    }),
    (error) => ErrorFactories.database('get_products', 'Failed to fetch products', undefined, error)
  );
};

// ✅ CORRECTO: Query con múltiples filtros incluyendo tenantId
const getProductById = async (id: string, tenantId: string): Promise<Result<Product, DomainError>> => {
  return fromPromise(
    db.products.findFirst({
      where: { 
        id,
        tenantId  // SIEMPRE incluir
      }
    }),
    (error) => ErrorFactories.database('get_product', `Failed to fetch product ${id}`, undefined, error)
  );
};

// ✅ CORRECTO: Join con filtro tenantId
const getBookingsWithDetails = async (tenantId: string): Promise<Result<BookingWithDetails[], DomainError>> => {
  return fromPromise(
    db.bookings.findMany({
      where: { tenantId },
      include: {
        customer: true,
        service: { where: { tenantId } },  // También filtrar relaciones
      }
    }),
    (error) => ErrorFactories.database('get_bookings', 'Failed to fetch bookings', undefined, error)
  );
};
```

### 3.2 Patrones Prohibidos

```typescript
// ❌ PROHIBIDO: Query sin filtro tenant
const getProducts = async () => {
  return db.products.findMany();  // PELIGROSO
};

// ❌ PROHIBIDO: Trust client input para tenant
const createProduct = async (data: CreateProductInput) => {
  return db.products.create({
    data: {
      ...data,
      tenantId: data.tenantId  // NO confiar en el cliente
    }
  });
};

// ❌ PROHIBIDO: Query por ID sin verificar tenant
const getProduct = async (id: string) => {
  return db.products.findUnique({ where: { id } });  // Puede acceder a otro tenant
};
```

### 3.3 Patrón Correcto para Mutaciones

```typescript
// ✅ CORRECTO: Usar tenantId del contexto autenticado
const createProduct = async (
  data: CreateProductInput,
  context: TenantContext  // Del middleware
): Promise<Result<Product, DomainError>> => {
  // Validar que el usuario tiene permisos en este tenant
  const hasPermission = await checkUserPermission(context.userId, context.tenantId, 'products:create');
  if (!hasPermission) {
    return Err(ErrorFactories.authorization('create_product'));
  }
  
  return fromPromise(
    db.products.create({
      data: {
        ...data,
        tenantId: context.tenantId  // Del contexto, NO del input
      }
    }),
    (error) => ErrorFactories.database('create_product', 'Failed to create product', undefined, error)
  );
};
```

---

## 4. Row Level Security (RLS)

### 4.1 Habilitar RLS

```sql
-- Habilitar RLS en tabla
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Crear policy para SELECT
CREATE POLICY "products_select_policy" ON products
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant')::text);

-- Crear policy para INSERT
CREATE POLICY "products_insert_policy" ON products
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant')::text);

-- Crear policy para UPDATE
CREATE POLICY "products_update_policy" ON products
  FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant')::text)
  WITH CHECK (tenant_id = current_setting('app.current_tenant')::text);

-- Crear policy para DELETE
CREATE POLICY "products_delete_policy" ON products
  FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant')::text);
```

### 4.2 Configurar Tenant en Sesión

```typescript
// Antes de cada query, configurar el tenant en la sesión de DB
const setTenantContext = async (tenantId: string) => {
  await db.$executeRaw`SET app.current_tenant = ${tenantId}`;
};
```

### 4.3 Verificar RLS

```bash
# Testear políticas RLS
npm run rls:test

# Verificar que RLS está habilitado
psql -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';"
```

---

## 5. Checklist de Multitenancy

### 5.1 Para Nuevas Tablas

- [ ] Agregar columna `tenant_id UUID NOT NULL`
- [ ] Crear foreign key a `tenants(id)`
- [ ] Crear índice en `tenant_id`
- [ ] Habilitar RLS
- [ ] Crear policies para SELECT, INSERT, UPDATE, DELETE
- [ ] Agregar a lista de tablas tenant-scoped en documentación

### 5.2 Para Nuevas Queries

- [ ] Incluye filtro `tenantId` en `where`
- [ ] `tenantId` viene del contexto autenticado
- [ ] Relaciones también filtran por `tenantId`
- [ ] Test de aislamiento entre tenants existe

### 5.3 Para Nuevos Endpoints

- [ ] Middleware extrae y valida tenant
- [ ] Servicio recibe `tenantId` del contexto
- [ ] Response no incluye datos de otros tenants
- [ ] Test de cross-tenant access falla correctamente

---

## 6. Tests de Aislamiento

### 6.1 Test Template

```typescript
// tests/integration/tenant-isolation.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createTenant, createUser, createProduct, getProduct } from '../utils/fixtures';

describe('Tenant Isolation', () => {
  let tenantA: Tenant;
  let tenantB: Tenant;
  let userA: User;
  let userB: User;

  beforeEach(async () => {
    tenantA = await createTenant({ name: 'Tenant A' });
    tenantB = await createTenant({ name: 'Tenant B' });
    userA = await createUser({ tenantId: tenantA.id });
    userB = await createUser({ tenantId: tenantB.id });
  });

  describe('Products', () => {
    it('should not allow tenant A to access tenant B products', async () => {
      // Crear producto en tenant B
      const productB = await createProduct({ 
        tenantId: tenantB.id, 
        name: 'Product B' 
      });

      // Intentar acceder desde tenant A
      const result = await getProduct(productB.id, tenantA.id);

      // Debe fallar o retornar null
      expect(result).toBeNull(); // Para Result Pattern: expectFailure(result)
    });

    it('should list only products from current tenant', async () => {
      // Crear productos en ambos tenants
      await createProduct({ tenantId: tenantA.id, name: 'Product A1' });
      await createProduct({ tenantId: tenantA.id, name: 'Product A2' });
      await createProduct({ tenantId: tenantB.id, name: 'Product B1' });

      // Listar productos de tenant A
      const productsA = await getProducts(tenantA.id);

      // Solo debe ver productos de tenant A
      expect(productsA).toHaveLength(2);
      expect(productsA.map(p => p.name)).toEqual(['Product A1', 'Product A2']);
    });

    it('should not allow creating products in other tenant', async () => {
      // Intentar crear producto en tenant B con contexto de tenant A
      const result = await createProduct(
        { name: 'Hacked Product', tenantId: tenantB.id },  // Intento de inyección
        { tenantId: tenantA.id, userId: userA.id }  // Contexto real
      );

      // El producto debe crearse en tenant A, ignorando el tenantId del input
      expect(result.tenantId).toBe(tenantA.id);
      
      // Verificar que no existe en tenant B
      const productInB = await db.products.findFirst({
        where: { name: 'Hacked Product', tenantId: tenantB.id }
      });
      expect(productInB).toBeNull();
    });
  });

  describe('Bookings', () => {
    // Tests similares para bookings...
  });

  describe('Customers', () => {
    // Tests similares para customers...
  });
});
```

### 6.2 Ejecutar Tests de Aislamiento

```bash
# Ejecutar todos los tests de aislamiento
npm run test:integration -- --grep "Tenant Isolation"

# Ejecutar con verbose
npm run test:integration -- --grep "Tenant Isolation" --reporter=verbose
```

---

## 7. Detección de Data Leakage

### 7.1 Queries de Auditoría

```sql
-- Verificar productos sin tenant_id
SELECT id, name FROM products WHERE tenant_id IS NULL;

-- Verificar bookings con tenant_id inválido
SELECT b.id, b.tenant_id 
FROM bookings b 
LEFT JOIN tenants t ON b.tenant_id = t.id 
WHERE t.id IS NULL;

-- Verificar RLS habilitado en todas las tablas tenant-scoped
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('products', 'services', 'bookings', 'customers', 'campaigns')
  AND rowsecurity = false;
```

### 7.2 Script de Verificación

```typescript
// scripts/verify-tenant-isolation.ts
import { db } from '../lib/db';

const TENANT_TABLES = [
  'products', 'services', 'bookings', 'customers', 
  'campaigns', 'social_posts', 'orders', 'quotes'
];

async function verifyTenantIsolation() {
  console.log('🔍 Verifying tenant isolation...\n');

  for (const table of TENANT_TABLES) {
    // Verificar registros sin tenant_id
    const orphaned = await db.$queryRaw`
      SELECT id FROM ${db.$raw(table)} WHERE tenant_id IS NULL LIMIT 1
    `;
    
    if (orphaned.length > 0) {
      console.error(`❌ ${table}: Found records without tenant_id`);
    } else {
      console.log(`✅ ${table}: All records have tenant_id`);
    }
  }

  console.log('\n✅ Verification complete');
}

verifyTenantIsolation();
```

---

## 8. Incident Response

### 8.1 Si se detecta data leakage

1. **INMEDIATO**: Notificar al equipo de seguridad
2. **Identificar alcance**: Qué datos fueron expuestos
3. **Rotar credenciales**: Si hay tokens comprometidos
4. **Revisar logs**: Identificar el origen del breach
5. **Documentar**: En `debug_logs.md` con tag `[SECURITY]`
6. **Corregir**: Aplicar fix y verificar con tests

### 8.2 Template de Incidente

```markdown
### [SECURITY] Data Leakage Detection - YYYY-MM-DD

| Campo | Valor |
|-------|-------|
| **Severidad** | CRÍTICA / ALTA / MEDIA |
| **Tabla(s) afectada** | products, bookings |
| **Descripción** | Query sin filtro tenantId |
| **Impacto** | X tenants potencialmente afectados |
| **Causa raíz** | Falta de middleware en endpoint |
| **Solución** | Agregar withTenantContext middleware |
| **Prevención** | Test de aislamiento obligatorio |
| **Referencia** | PR #XXX, commit XXX |
```

---

## 9. Referencias

- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [AGENTS.md - Multitenancy Section](../../AGENTS.md)
- [context_be.md](../memory/context_be.md)

---

*Este protocolo es CRÍTICO. Cualquier violación debe ser reportada inmediatamente.*
