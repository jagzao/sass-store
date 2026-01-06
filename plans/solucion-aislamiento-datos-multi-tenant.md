# Plan de Solución para el Aislamiento de Datos Multi-Tenant

## Problema Identificado

La funcionalidad de wondernails funciona correctamente, pero zo-system no funciona como se esperaba. El problema principal es la falta de aislamiento de datos entre tenants, específicamente:

1. **Falta de establecimiento del contexto de tenant en las rutas de API**: Las rutas de API como `/api/v1/products` obtienen el `tenantSlug` de la sesión del usuario, pero no establecen el contexto de tenant en la base de datos usando `set_tenant_context`.

2. **Inconsistencia en la obtención del tenant**: Algunas rutas de API obtienen el `tenantSlug` de la sesión del usuario, mientras que otras lo obtienen de los parámetros de la URL.

3. **Sin contexto de tenant, las políticas RLS no funcionan**: Las políticas de Row Level Security (RLS) dependen de `current_setting('app.current_tenant_id', TRUE)` para aislar los datos entre tenants.

## Solución Propuesta

### 1. Crear un Middleware para Establecer el Contexto de Tenant

Crear un archivo `apps/web/lib/db/tenant-context.ts` con el siguiente contenido:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@sass-store/database";
import { tenants } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

/**
 * Middleware para establecer el contexto de tenant en las operaciones de base de datos.
 * Este middleware se encarga de:
 * 1. Obtener el tenantSlug de la sesión del usuario o de la URL
 * 2. Verificar que el tenant existe
 * 3. Establecer el contexto de tenant en la base de datos usando set_tenant_context
 * 4. Ejecutar el handler con el contexto de tenant establecido
 */
export async function withTenantContext(
  request: NextRequest,
  handler: (request: NextRequest, tenantId: string) => Promise<NextResponse>,
  options?: {
    getTenantSlugFromSession?: boolean;
    getTenantSlugFromUrl?: boolean;
    requireAuth?: boolean;
  },
) {
  try {
    // Obtener tenantSlug de la sesión o de la URL
    let tenantSlug: string | null = null;

    if (options?.getTenantSlugFromUrl) {
      // Extraer tenantSlug de la URL
      const url = new URL(request.url);
      const pathParts = url.pathname.split("/");
      const tenantIndex = pathParts.findIndex((part) => part === "t");
      if (tenantIndex !== -1 && tenantIndex + 1 < pathParts.length) {
        tenantSlug = pathParts[tenantIndex + 1];
      }
    } else {
      // Por defecto, obtener de la sesión
      if (options?.requireAuth !== false) {
        const session = await getServerSession(authOptions);
        tenantSlug = session?.user?.tenantSlug || null;
      }
    }

    if (!tenantSlug) {
      console.error("[TenantContext] Tenant slug not found");
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    console.log(`[TenantContext] Using tenant slug: ${tenantSlug}`);

    // Verificar que el tenant existe
    const tenantResult = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenantResult || tenantResult.length === 0) {
      console.error(
        `[TenantContext] Tenant not found in database: ${tenantSlug}`,
      );
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const tenantId = tenantResult[0].id;
    console.log(`[TenantContext] Tenant found: ${tenantSlug} (${tenantId})`);

    // Establecer contexto de tenant en la base de datos
    try {
      await db.execute(sql`SELECT set_tenant_context(${tenantId}::uuid)`);
      console.log(
        `[TenantContext] Tenant context set successfully for ${tenantSlug}`,
      );
    } catch (error) {
      console.error("[TenantContext] Error setting tenant context:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }

    // Ejecutar el handler con el contexto de tenant establecido
    return await handler(request, tenantId.toString());
  } catch (error) {
    console.error("[TenantContext] Error in tenant context middleware:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Versión simplificada para rutas que obtienen el tenantSlug de los parámetros de la URL
 */
export async function withTenantContextFromParams(
  request: NextRequest,
  params: { tenant: string },
  handler: (request: NextRequest, tenantId: string) => Promise<NextResponse>,
) {
  try {
    const tenantSlug = params.tenant;

    if (!tenantSlug) {
      console.error("[TenantContext] Tenant slug not found in params");
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    console.log(`[TenantContext] Using tenant slug from params: ${tenantSlug}`);

    // Verificar que el tenant existe
    const tenantResult = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenantResult || tenantResult.length === 0) {
      console.error(
        `[TenantContext] Tenant not found in database: ${tenantSlug}`,
      );
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const tenantId = tenantResult[0].id;
    console.log(`[TenantContext] Tenant found: ${tenantSlug} (${tenantId})`);

    // Establecer contexto de tenant en la base de datos
    try {
      await db.execute(sql`SELECT set_tenant_context(${tenantId}::uuid)`);
      console.log(
        `[TenantContext] Tenant context set successfully for ${tenantSlug}`,
      );
    } catch (error) {
      console.error("[TenantContext] Error setting tenant context:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }

    // Ejecutar el handler con el contexto de tenant establecido
    return await handler(request, tenantId.toString());
  } catch (error) {
    console.error("[TenantContext] Error in tenant context middleware:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

### 2. Modificar las Rutas de API para Usar el Middleware

#### 2.1. Modificar `apps/web/app/api/v1/products/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@sass-store/database";
import { products, tenants } from "@sass-store/database/schema";
import { eq, and, desc } from "drizzle-orm";
import { withTenantContext } from "@/lib/db/tenant-context";

// GET /api/v1/products - Listar productos del tenant actual
export async function GET(request: NextRequest) {
  return withTenantContext(
    request,
    async (request, tenantId) => {
      try {
        const { searchParams } = new URL(request.url);
        const limitParam = searchParams.get("limit");
        const limit = limitParam ? parseInt(limitParam) : 100;

        // Build query to get products
        const result = await db
          .select({
            id: products.id,
            tenantId: products.tenantId,
            sku: products.sku,
            name: products.name,
            description: products.description,
            price: products.price,
            category: products.category,
            featured: products.featured,
            active: products.active,
            metadata: products.metadata,
            imageUrl: products.imageUrl,
            createdAt: products.createdAt,
            updatedAt: products.updatedAt,
          })
          .from(products)
          .where(eq(products.tenantId, tenantId))
          .orderBy(desc(products.createdAt))
          .limit(limit);

        // Transform the results to match the expected format
        const productsData = result.map((product) => ({
          id: product.id,
          tenantId: product.tenantId,
          sku: product.sku,
          name: product.name,
          description: product.description || "",
          price: product.price,
          category: product.category || "",
          featured: product.featured,
          active: product.active,
          metadata: product.metadata || {},
          imageUrl: product.imageUrl,
          createdAt: product.createdAt?.toISOString() || "",
        }));

        return NextResponse.json({
          data: productsData,
          count: productsData.length,
        });
      } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 },
        );
      }
    },
    { getTenantSlugFromSession: true },
  );
}

// POST /api/v1/products - Crear un nuevo producto
export async function POST(request: NextRequest) {
  return withTenantContext(
    request,
    async (request, tenantId) => {
      try {
        const body = await request.json();
        const {
          sku,
          name,
          description,
          price,
          category,
          featured,
          active,
          metadata,
        } = body;

        // Validar campos requeridos
        if (!sku || !name || !price || !category) {
          return NextResponse.json(
            { error: "Missing required fields: sku, name, price, category" },
            { status: 400 },
          );
        }

        // Verificar si ya existe un producto con el mismo SKU para este tenant
        const existingProduct = await db
          .select({ id: products.id })
          .from(products)
          .where(and(eq(products.tenantId, tenantId), eq(products.sku, sku)))
          .limit(1);

        if (existingProduct && existingProduct.length > 0) {
          return NextResponse.json(
            { error: "Product with this SKU already exists" },
            { status: 400 },
          );
        }

        // Crear el producto
        const newProduct = await db
          .insert(products)
          .values({
            tenantId,
            sku,
            name,
            description: description || null,
            price: price.toString(),
            category,
            featured: featured || false,
            active: active !== undefined ? active : true,
            metadata: metadata || {},
            imageUrl: null,
          })
          .returning();

        return NextResponse.json({
          data: newProduct[0],
          message: "Product created successfully",
        });
      } catch (error) {
        console.error("Error creating product:", error);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 },
        );
      }
    },
    { getTenantSlugFromSession: true },
  );
}
```

#### 2.2. Modificar `apps/web/app/api/v1/products/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@sass-store/database";
import { products, tenants } from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";
import { withTenantContext } from "@/lib/db/tenant-context";

interface RouteParams {
  params: { id: string };
}

// GET /api/v1/products/[id] - Obtener un producto específico
export async function GET(request: NextRequest, context: RouteParams) {
  return withTenantContext(
    request,
    async (request, tenantId) => {
      try {
        const { id } = context.params;

        // Get the product
        const productResult = await db
          .select({
            id: products.id,
            tenantId: products.tenantId,
            sku: products.sku,
            name: products.name,
            description: products.description,
            price: products.price,
            category: products.category,
            featured: products.featured,
            active: products.active,
            metadata: products.metadata,
            imageUrl: products.imageUrl,
            createdAt: products.createdAt,
            updatedAt: products.updatedAt,
          })
          .from(products)
          .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))
          .limit(1);

        if (!productResult || productResult.length === 0) {
          return NextResponse.json(
            { error: "Product not found" },
            { status: 404 },
          );
        }

        const product = productResult[0];

        return NextResponse.json({
          data: {
            id: product.id,
            tenantId: product.tenantId,
            sku: product.sku,
            name: product.name,
            description: product.description || "",
            price: product.price,
            category: product.category || "",
            featured: product.featured,
            active: product.active,
            metadata: product.metadata || {},
            imageUrl: product.imageUrl,
            createdAt: product.createdAt?.toISOString() || "",
          },
        });
      } catch (error) {
        console.error("Error fetching product:", error);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 },
        );
      }
    },
    { getTenantSlugFromSession: true },
  );
}

// PUT /api/v1/products/[id] - Actualizar un producto
export async function PUT(request: NextRequest, context: RouteParams) {
  return withTenantContext(
    request,
    async (request, tenantId) => {
      try {
        const { id } = context.params;

        const body = await request.json();
        const {
          sku,
          name,
          description,
          price,
          category,
          featured,
          active,
          metadata,
        } = body;

        // Validar campos requeridos
        if (!sku || !name || !price || !category) {
          return NextResponse.json(
            { error: "Missing required fields: sku, name, price, category" },
            { status: 400 },
          );
        }

        // Check if product exists and belongs to this tenant
        const existingProduct = await db
          .select({ id: products.id, sku: products.sku })
          .from(products)
          .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))
          .limit(1);

        if (!existingProduct || existingProduct.length === 0) {
          return NextResponse.json(
            { error: "Product not found" },
            { status: 404 },
          );
        }

        // Verificar si ya existe otro producto con el mismo SKU para este tenant
        const duplicateProduct = await db
          .select({ id: products.id })
          .from(products)
          .where(
            and(
              eq(products.tenantId, tenantId),
              eq(products.sku, sku),
              eq(products.id, id),
            ),
          )
          .limit(1);

        if (
          duplicateProduct &&
          duplicateProduct.length > 0 &&
          duplicateProduct[0].id !== id
        ) {
          return NextResponse.json(
            { error: "Another product with this SKU already exists" },
            { status: 400 },
          );
        }

        // Update the product
        const updatedProduct = await db
          .update(products)
          .set({
            sku,
            name,
            description: description || null,
            price: price.toString(),
            category,
            featured: featured || false,
            active: active !== undefined ? active : true,
            metadata: metadata || {},
            updatedAt: new Date(),
          })
          .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))
          .returning();

        return NextResponse.json({
          data: updatedProduct[0],
          message: "Product updated successfully",
        });
      } catch (error) {
        console.error("Error updating product:", error);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 },
        );
      }
    },
    { getTenantSlugFromSession: true },
  );
}

// DELETE /api/v1/products/[id] - Eliminar un producto
export async function DELETE(request: NextRequest, context: RouteParams) {
  return withTenantContext(
    request,
    async (request, tenantId) => {
      try {
        const { id } = context.params;

        // Check if product exists and belongs to this tenant
        const existingProduct = await db
          .select({ id: products.id })
          .from(products)
          .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))
          .limit(1);

        if (!existingProduct || existingProduct.length === 0) {
          return NextResponse.json(
            { error: "Product not found" },
            { status: 404 },
          );
        }

        // Delete the product
        await db
          .delete(products)
          .where(and(eq(products.id, id), eq(products.tenantId, tenantId)));

        return NextResponse.json({
          message: "Product deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting product:", error);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 },
        );
      }
    },
    { getTenantSlugFromSession: true },
  );
}
```

### 3. Modificar Otras Rutas de API

De manera similar, debemos modificar todas las rutas de API que requieran aislamiento de datos para usar el middleware `withTenantContext` o `withTenantContextFromParams`. Esto incluye:

- `/api/v1/services/route.ts`
- `/api/v1/bookings/route.ts`
- `/api/tenants/[tenant]/products/route.ts`
- `/api/tenants/[tenant]/services/route.ts`
- Y otras rutas que manipulen datos específicos del tenant

### 4. Verificar la Sesión del Usuario

Asegurarse de que durante el inicio de sesión se guarde correctamente el `tenantSlug` en la sesión del usuario. Esto ya debería estar implementado en `packages/config/src/auth.ts`, pero debemos verificar que funcione correctamente.

### 5. Agregar Logging Mejorado

El middleware `withTenantContext` ya incluye logging detallado para rastrear problemas con el contexto de tenant. Esto ayudará a diagnosticar problemas en el futuro.

### 6. Crear Pruebas Unitarias y de Integración

Crear pruebas para validar el correcto aislamiento de datos entre tenants. Esto debe incluir:

- Pruebas unitarias para el middleware `withTenantContext`
- Pruebas de integración para las rutas de API que usen el middleware
- Pruebas end-to-end para verificar el aislamiento de datos entre tenants

### 7. Documentar las Mejores Prácticas

Crear documentación sobre las mejores prácticas para el desarrollo multi-tenant en la aplicación, incluyendo:

- Cómo usar el middleware `withTenantContext`
- Cómo estructurar nuevas rutas de API para que sean multi-tenant
- Cómo probar el aislamiento de datos entre tenants

## Conclusión

La implementación de este plan debería solucionar los problemas de aislamiento de datos entre tenants y hacer que la funcionalidad de zo-system funcione correctamente al igual que wondernails. La clave es establecer el contexto de tenant antes de ejecutar cualquier operación de base de datos, lo que permite que las políticas RLS funcionen correctamente.
