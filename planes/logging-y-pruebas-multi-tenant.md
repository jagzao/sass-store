# Plan de Logging Mejorado y Pruebas para Multi-Tenant

## 1. Logging Mejorado para Diagnóstico Multi-Tenant

### 1.1. Middleware de Logging para Tenant Context

El middleware `withTenantContext` que hemos propuesto ya incluye logging básico, pero podemos mejorarlo para proporcionar más detalles y facilitar el diagnóstico.

```typescript
// apps/web/lib/db/tenant-context.ts (mejorado)

export async function withTenantContext(
  request: NextRequest,
  handler: (request: NextRequest, tenantId: string) => Promise<NextResponse>,
  options?: {
    getTenantSlugFromSession?: boolean;
    getTenantSlugFromUrl?: boolean;
    requireAuth?: boolean;
    logLevel?: "error" | "warn" | "info" | "debug";
  },
) {
  const logLevel = options?.logLevel || "info";
  const startTime = Date.now();

  const log = (
    level: "error" | "warn" | "info" | "debug",
    message: string,
    data?: any,
  ) => {
    if (
      logLevel === "error" ||
      logLevel === "warn" ||
      (logLevel === "info" && (level === "info" || level === "debug")) ||
      logLevel === "debug"
    ) {
      console[level](`[TenantContext] ${message}`, data || "");
    }
  };

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
      log("debug", `Extracted tenant slug from URL: ${tenantSlug}`);
    } else {
      // Por defecto, obtener de la sesión
      if (options?.requireAuth !== false) {
        const session = await getServerSession(authOptions);
        tenantSlug = session?.user?.tenantSlug || null;
        log("debug", `Extracted tenant slug from session: ${tenantSlug}`);
      }
    }

    if (!tenantSlug) {
      log("error", "Tenant slug not found");
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    log("info", `Using tenant slug: ${tenantSlug}`);

    // Verificar que el tenant existe
    const tenantResult = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenantResult || tenantResult.length === 0) {
      log("error", `Tenant not found in database: ${tenantSlug}`);
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const tenantId = tenantResult[0].id;
    log("info", `Tenant found: ${tenantSlug} (${tenantId})`);

    // Establecer contexto de tenant en la base de datos
    try {
      await db.execute(sql`SELECT set_tenant_context(${tenantId}::uuid)`);
      log("info", `Tenant context set successfully for ${tenantSlug}`);
    } catch (error) {
      log("error", "Error setting tenant context", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }

    // Ejecutar el handler con el contexto de tenant establecido
    const response = await handler(request, tenantId.toString());

    const duration = Date.now() - startTime;
    log("info", `Request completed in ${duration}ms for tenant ${tenantSlug}`);

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    log(
      "error",
      `Error in tenant context middleware after ${duration}ms`,
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

### 1.2. Logger Centralizado

Crear un logger centralizado para toda la aplicación:

```typescript
// apps/web/lib/logger.ts

type LogLevel = "error" | "warn" | "info" | "debug";

interface LoggerOptions {
  level?: LogLevel;
  context?: string;
}

export class AppLogger {
  private level: LogLevel;
  private context: string;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level || "info";
    this.context = options.context || "App";
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["error", "warn", "info", "debug"];
    const currentLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private log(level: LogLevel, message: string, data?: any) {
    if (this.shouldLog(level)) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.context}]`;

      if (data) {
        console[level](`${prefix} ${message}`, data);
      } else {
        console[level](`${prefix} ${message}`);
      }
    }
  }

  error(message: string, data?: any) {
    this.log("error", message, data);
  }

  warn(message: string, data?: any) {
    this.log("warn", message, data);
  }

  info(message: string, data?: any) {
    this.log("info", message, data);
  }

  debug(message: string, data?: any) {
    this.log("debug", message, data);
  }

  withContext(context: string): AppLogger {
    return new AppLogger({
      level: this.level,
      context,
    });
  }
}

export const logger = new AppLogger();
```

### 1.3. Integración del Logger en el Middleware de Tenant

```typescript
// apps/web/lib/db/tenant-context.ts (con logger centralizado)

import { logger } from "@/lib/logger";

export async function withTenantContext(
  request: NextRequest,
  handler: (request: NextRequest, tenantId: string) => Promise<NextResponse>,
  options?: {
    getTenantSlugFromSession?: boolean;
    getTenantSlugFromUrl?: boolean;
    requireAuth?: boolean;
    logLevel?: LogLevel;
  },
) {
  const tenantLogger = logger.withContext("TenantContext");
  const logLevel = options?.logLevel || "info";
  const startTime = Date.now();

  // Configurar nivel de logging para esta instancia
  tenantLogger["level"] = logLevel;

  try {
    // ... (resto del código con tenantLogger en lugar de log)

    tenantLogger.info(`Using tenant slug: ${tenantSlug}`);

    // ...
  } catch (error) {
    const duration = Date.now() - startTime;
    tenantLogger.error(
      `Error in tenant context middleware after ${duration}ms`,
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

## 2. Pruebas Unitarias y de Integración

### 2.1. Pruebas Unitarias para el Middleware de Tenant Context

```typescript
// tests/unit/tenant-context.test.ts

import { withTenantContext } from "@/lib/db/tenant-context";
import { NextRequest } from "next/server";
import { db } from "@sass-store/database";
import { tenants } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";

// Mock de la base de datos
jest.mock("@sass-store/database", () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([{ id: "test-tenant-id" }]),
    execute: jest.fn().mockResolvedValue({}),
  },
}));

// Mock de getServerSession
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

describe("withTenantContext", () => {
  let request: NextRequest;
  let handler: jest.Mock;

  beforeEach(() => {
    request = new NextRequest("http://localhost:3000/api/test");
    handler = jest.fn().mockResolvedValue(new Response("OK"));
  });

  it("should set tenant context and call handler", async () => {
    // Arrange
    const { getServerSession } = await import("next-auth");
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { tenantSlug: "test-tenant" },
    });

    // Act
    const response = await withTenantContext(request, handler, {
      getTenantSlugFromSession: true,
    });

    // Assert
    expect(handler).toHaveBeenCalledWith(request, "test-tenant-id");
  });

  it("should return 404 if tenant not found", async () => {
    // Arrange
    const { getServerSession } = await import("next-auth");
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { tenantSlug: "unknown-tenant" },
    });

    // Mock db to return empty result
    (db.select as jest.Mock).mockReturnThis();
    (db.from as jest.Mock).mockReturnThis();
    (db.where as jest.Mock).mockReturnThis();
    (db.limit as jest.Mock).mockResolvedValue([]);

    // Act
    const response = await withTenantContext(request, handler, {
      getTenantSlugFromSession: true,
    });

    // Assert
    expect(response.status).toBe(404);
    expect(handler).not.toHaveBeenCalled();
  });

  it("should return 500 if setting tenant context fails", async () => {
    // Arrange
    const { getServerSession } = await import("next-auth");
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { tenantSlug: "test-tenant" },
    });

    // Mock db.execute to throw error
    (db.execute as jest.Mock).mockRejectedValue(new Error("Database error"));

    // Act
    const response = await withTenantContext(request, handler, {
      getTenantSlugFromSession: true,
    });

    // Assert
    expect(response.status).toBe(500);
    expect(handler).not.toHaveBeenCalled();
  });
});
```

### 2.2. Pruebas de Integración para Rutas de API

```typescript
// tests/integration/products-api.test.ts

import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/v1/products/route";
import { db } from "@sass-store/database";
import { products, tenants } from "@sass-store/database/schema";

describe("Products API", () => {
  let testTenant: any;
  let testProduct: any;

  beforeAll(async () => {
    // Crear tenant de prueba
    const [tenantResult] = await db
      .insert(tenants)
      .values({
        slug: "test-tenant",
        name: "Test Tenant",
        mode: "catalog",
        status: "active",
        timezone: "America/Mexico_City",
        branding: {},
        contact: {},
        location: {},
        quotas: {},
      })
      .returning();

    testTenant = tenantResult;
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    if (testTenant) {
      await db.delete(tenants).where(eq(tenants.id, testTenant.id));
    }
  });

  describe("GET /api/v1/products", () => {
    it("should return products for the current tenant", async () => {
      // Arrange
      const request = new NextRequest("http://localhost:3000/api/v1/products", {
        headers: {
          // Simular sesión de usuario con tenant
          Cookie: `next-auth.session-token=test-session`,
        },
      });

      // Mock de sesión
      jest.spyOn(require("next-auth"), "getServerSession").mockResolvedValue({
        user: { tenantSlug: "test-tenant" },
      });

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe("POST /api/v1/products", () => {
    it("should create a new product for the current tenant", async () => {
      // Arrange
      const request = new NextRequest("http://localhost:3000/api/v1/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `next-auth.session-token=test-session`,
        },
        body: JSON.stringify({
          sku: "TEST-001",
          name: "Test Product",
          price: "10.00",
          category: "Test Category",
        }),
      });

      // Mock de sesión
      jest.spyOn(require("next-auth"), "getServerSession").mockResolvedValue({
        user: { tenantSlug: "test-tenant" },
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.sku).toBe("TEST-001");
      expect(data.data.name).toBe("Test Product");

      // Guardar producto para limpieza
      testProduct = data.data;
    });

    it("should not allow creating product with duplicate SKU", async () => {
      // Arrange
      const request = new NextRequest("http://localhost:3000/api/v1/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `next-auth.session-token=test-session`,
        },
        body: JSON.stringify({
          sku: "TEST-001", // Mismo SKU que el producto creado anteriormente
          name: "Another Test Product",
          price: "15.00",
          category: "Test Category",
        }),
      });

      // Mock de sesión
      jest.spyOn(require("next-auth"), "getServerSession").mockResolvedValue({
        user: { tenantSlug: "test-tenant" },
      });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("already exists");
    });

    afterAll(async () => {
      // Limpiar producto de prueba
      if (testProduct) {
        await db.delete(products).where(eq(products.id, testProduct.id));
      }
    });
  });
});
```

### 2.3. Pruebas de Aislamiento de Datos

```typescript
// tests/integration/tenant-isolation.test.ts

import { NextRequest } from "next/server";
import { GET as getProducts } from "@/app/api/v1/products/route";
import { POST as createProduct } from "@/app/api/v1/products/route";
import { db } from "@sass-store/database";
import { products, tenants } from "@sass-store/database/schema";

describe("Tenant Data Isolation", () => {
  let tenantA: any;
  let tenantB: any;
  let productInTenantA: any;

  beforeAll(async () => {
    // Crear dos tenants de prueba
    const [tenantAResult] = await db
      .insert(tenants)
      .values({
        slug: "tenant-a",
        name: "Tenant A",
        mode: "catalog",
        status: "active",
        timezone: "America/Mexico_City",
        branding: {},
        contact: {},
        location: {},
        quotas: {},
      })
      .returning();

    const [tenantBResult] = await db
      .insert(tenants)
      .values({
        slug: "tenant-b",
        name: "Tenant B",
        mode: "catalog",
        status: "active",
        timezone: "America/Mexico_City",
        branding: {},
        contact: {},
        location: {},
        quotas: {},
      })
      .returning();

    tenantA = tenantAResult;
    tenantB = tenantBResult;

    // Crear un producto en tenant A
    const createRequest = new NextRequest(
      "http://localhost:3000/api/v1/products",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sku: "TENANT-A-001",
          name: "Product in Tenant A",
          price: "10.00",
          category: "Test Category",
        }),
      },
    );

    // Mock de sesión para tenant A
    jest.spyOn(require("next-auth"), "getServerSession").mockResolvedValue({
      user: { tenantSlug: "tenant-a" },
    });

    const createResponse = await createProduct(createRequest);
    const createData = await createResponse.json();
    productInTenantA = createData.data;
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    if (productInTenantA) {
      await db.delete(products).where(eq(products.id, productInTenantA.id));
    }

    if (tenantA) {
      await db.delete(tenants).where(eq(tenants.id, tenantA.id));
    }

    if (tenantB) {
      await db.delete(tenants).where(eq(tenants.id, tenantB.id));
    }
  });

  it("should not allow tenant B to access products from tenant A", async () => {
    // Arrange
    const request = new NextRequest("http://localhost:3000/api/v1/products", {
      headers: {
        Cookie: `next-auth.session-token=test-session`,
      },
    });

    // Mock de sesión para tenant B
    jest.spyOn(require("next-auth"), "getServerSession").mockResolvedValue({
      user: { tenantSlug: "tenant-b" },
    });

    // Act
    const response = await getProducts(request);

    // Assert
    expect(response.status).toBe(200);
    const data = await response.json();

    // El producto creado en tenant A no debería estar visible para tenant B
    const productFound = data.data.find((p: any) => p.sku === "TENANT-A-001");
    expect(productFound).toBeUndefined();
  });

  it("should allow tenant A to access their own products", async () => {
    // Arrange
    const request = new NextRequest("http://localhost:3000/api/v1/products", {
      headers: {
        Cookie: `next-auth.session-token=test-session`,
      },
    });

    // Mock de sesión para tenant A
    jest.spyOn(require("next-auth"), "getServerSession").mockResolvedValue({
      user: { tenantSlug: "tenant-a" },
    });

    // Act
    const response = await getProducts(request);

    // Assert
    expect(response.status).toBe(200);
    const data = await response.json();

    // El producto creado en tenant A debería estar visible para tenant A
    const productFound = data.data.find((p: any) => p.sku === "TENANT-A-001");
    expect(productFound).toBeDefined();
    expect(productFound.name).toBe("Product in Tenant A");
  });
});
```

## 3. Documentación de Mejores Prácticas

````markdown
# Mejores Prácticas para Desarrollo Multi-Tenant

## 1. Uso del Middleware `withTenantContext`

Todas las rutas de API que manipulen datos específicos del tenant deben usar el middleware `withTenantContext` para asegurar el aislamiento de datos.

### Para rutas que obtienen el tenant de la sesión:

```typescript
import { withTenantContext } from "@/lib/db/tenant-context";

export async function GET(request: NextRequest) {
  return withTenantContext(
    request,
    async (request, tenantId) => {
      // Tu código aquí, el contexto de tenant ya está establecido
      // Todas las consultas a la base de datos respetarán las políticas RLS
    },
    { getTenantSlugFromSession: true },
  );
}
```
````

### Para rutas que obtienen el tenant de la URL:

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
      // Tu código aquí, el contexto de tenant ya está establecido
    },
  );
}
```

## 2. Estructura de Nuevas Rutas de API Multi-Tenant

Cuando crees nuevas rutas de API que deban ser multi-tenant, sigue esta estructura:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/db/tenant-context";
import { db } from "@sass-store/database";
import { yourTable } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  return withTenantContext(
    request,
    async (request, tenantId) => {
      try {
        const data = await db
          .select()
          .from(yourTable)
          .where(eq(yourTable.tenantId, tenantId));

        return NextResponse.json({ data });
      } catch (error) {
        console.error("Error fetching data:", error);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 },
        );
      }
    },
    { getTenantSlugFromSession: true },
  );
}

export async function POST(request: NextRequest) {
  return withTenantContext(
    request,
    async (request, tenantId) => {
      try {
        const body = await request.json();

        const newData = await db
          .insert(yourTable)
          .values({
            ...body,
            tenantId, // Asegúrate de incluir el tenantId
          })
          .returning();

        return NextResponse.json({ data: newData[0] });
      } catch (error) {
        console.error("Error creating data:", error);
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

## 3. Pruebas de Aislamiento de Datos

Siempre crea pruebas para verificar el aislamiento de datos entre tenants:

```typescript
// 1. Crea datos en un tenant
// 2. Verifica que esos datos no sean accesibles desde otro tenant
// 3. Verifica que los datos sean accesibles desde el tenant original
```

## 4. Logging

Usa el logger centralizado para todas las operaciones:

```typescript
import { logger } from "@/lib/logger";

logger.info("Operation completed", {
  tenant: tenantSlug,
  operation: "create_product",
  duration: 123,
});
```

## 5. Manejo de Errores

Siempre maneja los errores de manera consistente:

```typescript
try {
  // Operación de base de datos
} catch (error) {
  logger.error("Database operation failed", { error, tenantId });
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
```

## 6. Consideraciones de Rendimiento

- El middleware `withTenantContext` establece el contexto de tenant para cada solicitud, lo que tiene un costo mínimo de rendimiento.
- Para operaciones masivas, considera agruparlas bajo un solo contexto de tenant.
- Usa el nivel de logging apropiado para el entorno (producción vs. desarrollo).

## 7. Seguridad

- Nunca confíes en el cliente para proporcionar el tenantId. Siempre obtén el tenant de la sesión o de la URL validada.
- Las políticas RLS son tu última línea de defensa. Asegúrate de que estén correctamente configuradas.
- Valida siempre que el usuario tenga permiso para realizar la operación en el tenant específico.

```

## Conclusión

La implementación de logging mejorado y pruebas unitarias y de integración nos permitirá:

1. **Diagnosticar problemas rápidamente** con el logging detallado del contexto de tenant.
2. **Asegurar el aislamiento de datos** entre tenants mediante pruebas automatizadas.
3. **Mantener la calidad del código** con pruebas que se ejecuten en cada cambio.

Esto completará la solución para el problema multi-tenant y asegurará que la funcionalidad de zo-system funcione correctamente al igual que wondernails.
```
