# Mejores Prácticas para el Desarrollo Multi-Tenant

Este documento describe las mejores prácticas y patrones a seguir al desarrollar funcionalidades en una aplicación multi-tenant como SASS Store.

## 1. Arquitectura Multi-Tenant

### 1.1. Principios Fundamentales

- **Aislamiento de Datos**: Cada tenant debe tener sus datos completamente aislados de los demás.
- **Consistencia**: La funcionalidad debe ser consistente entre todos los tenants, con solo diferencias en los datos y ciertas personalizaciones.
- **Escalabilidad**: La arquitectura debe permitir la adición de nuevos tenants sin afectar el rendimiento de los existentes.

### 1.2. Componentes Clave

- **Row Level Security (RLS)**: Utilizar políticas de RLS en la base de datos para garantizar el aislamiento de datos a nivel de base de datos.
- **Contexto de Tenant**: Establecer el contexto de tenant antes de cualquier operación de base de datos.
- **Middleware de Tenant**: Utilizar middleware para automatizar el establecimiento del contexto de tenant en las rutas de API.

## 2. Establecimiento del Contexto de Tenant

### 2.1. Uso del Middleware `withTenantContext`

Todas las rutas de API que operan con datos específicos de tenant deben utilizar el middleware `withTenantContext`:

```typescript
import { withTenantContext } from "@/lib/db/tenant-context";

export async function GET(request: NextRequest) {
  return withTenantContext(
    request,
    async (request, tenantId) => {
      // Tu lógica aquí
      // No necesitas filtrar por tenantId ya que el contexto está establecido
      const result = await db.select().from(products);
      return NextResponse.json({ data: result });
    },
    { logLevel: "info" },
  );
}
```

### 2.2. Opciones del Middleware

El middleware `withTenantContext` acepta las siguientes opciones:

- `getTenantSlugFromSession`: Obtiene el tenantSlug de la sesión del usuario (por defecto: `true`).
- `getTenantSlugFromUrl`: Obtiene el tenantSlug de la URL (por defecto: `false`).
- `requireAuth`: Requiere autenticación (por defecto: `true`).
- `logLevel`: Nivel de logging (`error`, `warn`, `info`, `debug`).

### 2.3. Uso con Parámetros de URL

Para rutas que incluyen el tenantSlug en la URL, como `/t/[tenant]/api/...`, utiliza `withTenantContextFromParams`:

```typescript
import { withTenantContextFromParams } from "@/lib/db/tenant-context";

export async function GET(
  request: NextRequest,
  context: { params: { tenant: string } },
) {
  return withTenantContextFromParams(
    request,
    context.params,
    async (request, tenantId) => {
      // Tu lógica aquí
      return NextResponse.json({ data: result });
    },
  );
}
```

## 3. Operaciones de Base de Datos

### 3.1. No Filtrar por TenantId en las Consultas

Una vez establecido el contexto de tenant, no es necesario filtrar explícitamente por `tenantId` en las consultas, ya que las políticas de RLS se encargarán de ello:

```typescript
// Incorrecto - redundante
const result = await db
  .select()
  .from(products)
  .where(eq(products.tenantId, tenantId));

// Correcto - el contexto de tenant se encarga del filtrado
const result = await db.select().from(products);
```

### 3.2. Inserción de Datos

Al insertar datos, no es necesario especificar el `tenantId` si se utiliza un valor por defecto en la base de datos:

```typescript
// Incorrecto - redundante
await db.insert(products).values({
  tenantId, // Esto no es necesario si la base de datos lo establece por defecto
  sku: "PROD-001",
  name: "Producto",
  // ...
});

// Correcto - la base de datos establece el tenantId
await db.insert(products).values({
  sku: "PROD-001",
  name: "Producto",
  // ...
});
```

## 4. Logging y Diagnóstico

### 4.1. Uso del Logger Centralizado

Utiliza el logger centralizado para todas las operaciones:

```typescript
import { logger } from "@/lib/logger";

// En el middleware
logger.info("Tenant context set successfully", { tenantSlug });

// En caso de error
logger.error("Error fetching products", error);
```

### 4.2. Niveles de Logging

- `error`: Para errores críticos que necesitan atención inmediata.
- `warn`: Para situaciones inusuales que no son errores.
- `info`: Para información importante sobre el flujo de la aplicación.
- `debug`: Para información detallada útil para depuración.

## 5. Pruebas

### 5.1. Pruebas Unitarias

Cada componente debe tener pruebas unitarias que verifiquen su funcionamiento de forma aislada:

```typescript
describe("withTenantContext", () => {
  it("debería establecer el contexto de tenant y ejecutar el handler", async () => {
    // Configuración de la prueba
    const result = await withTenantContext(mockRequest, mockHandler);

    expect(result).toBeDefined();
    expect(mockHandler).toHaveBeenCalledWith(mockRequest, "tenant-uuid-123");
  });
});
```

### 5.2. Pruebas de Integración

Las pruebas de integración deben verificar el aislamiento de datos entre tenants:

```typescript
it("no debería permitir acceder a productos de otro tenant", async () => {
  // Establecer contexto del tenant 1
  await db.execute(sql`SELECT set_tenant_context(${tenant1Id}::uuid)`);

  // Intentar obtener el producto del tenant 2
  const response = await fetch(`/api/v1/products/${product2Id}`, {
    method: "GET",
    headers: {
      Cookie: `next-auth.session-token=test-session-tenant-1`,
    },
  });

  expect(response.status).toBe(404);
});
```

### 5.3. Pruebas End-to-End

Las pruebas end-to-end deben simular flujos completos de usuarios para diferentes tenants.

## 6. Personalización por Tenant

### 6.1. Personalización Controlada

La personalización por tenant debe ser controlada y limitada a aspectos específicos:

- **Hero Section**: Cada tenant puede tener su propia hero section personalizada.
- **Colores y Tema**: Cada tenant puede tener su propia paleta de colores.
- **Logo y Branding**: Cada tenant puede tener su propio logo y elementos de branding.

### 6.2. Datos Compartidos

La lógica de negocio y la estructura de datos deben ser consistentes entre todos los tenants.

## 7. Seguridad

### 7.1. Validación de Tenant

Siempre validar que el tenant existe y que el usuario tiene permisos para acceder a él:

```typescript
// El middleware ya se encarga de esta validación
const tenantResult = await db
  .select({ id: tenants.id })
  .from(tenants)
  .where(eq(tenants.slug, tenantSlug))
  .limit(1);

if (!tenantResult || tenantResult.length === 0) {
  return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
}
```

### 7.2. Sanitización de Datos

Siempre sanitizar y validar los datos de entrada para evitar inyección de SQL y otros ataques.

## 8. Rendimiento

### 8.1. Optimización de Consultas

Aprovechar el contexto de tenant para optimizar las consultas, ya que las políticas de RLS pueden hacer uso de índices.

### 8.2. Caching

Implementar estrategias de caching que consideren el tenant para evitar mezclar datos entre tenants.

## 9. Despliegue

### 9.1. Migraciones de Base de Datos

Las migraciones de base de datos deben ser compatibles con todos los tenants y no deben interrumpir el servicio.

### 9.2. Monitorización

Implementar monitorización que permita identificar problemas específicos de tenant.

## 10. Documentación

### 10.1. Documentación de API

Documentar todas las rutas de API indicando si requieren contexto de tenant y cómo se obtiene.

### 10.2. Guías de Desarrollo

Mantener guías de desarrollo actualizadas con las mejores prácticas multi-tenant.

## Conclusión

Seguir estas mejores prácticas garantizará que la aplicación mantenga un adecuado aislamiento de datos entre tenants, una funcionalidad consistente y un rendimiento óptimo a medida que la base de usuarios crece.
