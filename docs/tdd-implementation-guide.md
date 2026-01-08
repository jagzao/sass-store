# Guía de Implementación TDD (Test-Driven Development)

Esta guía explica cómo implementar el patrón TDD (Test-Driven Development) para el desarrollo de nuevos features en la aplicación SASS Store.

## ¿Qué es TDD?

Test-Driven Development (TDD) es una práctica de desarrollo de software que sigue un ciclo corto de iteraciones:

1. **Red (Rojo)**: Escribir una prueba que falla para una nueva funcionalidad.
2. **Green (Verde)**: Escribir el código mínimo necesario para que la prueba pase.
3. **Refactor (Refactorización)**: Mejorar el código manteniendo las pruebas en verde.

## Beneficios de TDD

- **Mayor calidad del código**: Las pruebas aseguran que el código funciona como se espera.
- **Diseño mejorado**: Obliga a pensar en la interfaz antes de la implementación.
- **Confianza para refactorizar**: Con pruebas sólidas, puedes refactorizar sin miedo a romper funcionalidades existentes.
- **Documentación viva**: Las pruebas sirven como documentación ejecutable de cómo funciona el código.

## Ciclo TDD en Detalle

### 1. Red (Rojo) - Escribir una prueba que falla

Antes de escribir cualquier código de producción, escribe una prueba que defina cómo debería comportarse la nueva funcionalidad. La prueba debe fallar porque aún no has implementado la funcionalidad.

**Ejemplo:**

```typescript
// tests/unit/social-posts.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "@/app/api/v1/social/queue/route";

describe("Social Posts API", () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    // Configurar la solicitud mock
    mockRequest = {
      url: "http://localhost:3000/api/v1/social/queue?tenant=test-tenant",
      json: async () => ({
        title: "Test Post",
        baseText: "This is a test post",
        status: "draft",
        platforms: [
          { platform: "facebook", variantText: "This is a test post" },
        ],
      }),
    } as NextRequest;
  });

  it("should create a new social post", async () => {
    // Esta prueba fallará porque aún no hemos implementado la funcionalidad
    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.title).toBe("Test Post");
    expect(data.data.baseText).toBe("This is a test post");
  });
});
```

### 2. Green (Verde) - Escribir el código mínimo para que la prueba pase

Ahora implementa el código mínimo necesario para que la prueba pase. No te preocupes por la perfección, solo haz que funcione.

**Ejemplo:**

```typescript
// apps/web/app/api/v1/social/queue/route.ts
export async function POST(request: NextRequest) {
  return withTenantContext(
    request,
    async (request, tenantId) => {
      try {
        const body = await request.json();
        const { title, baseText, status = "draft", platforms = [] } = body;

        if (!baseText) {
          return NextResponse.json(
            { success: false, error: "baseText is required" },
            { status: 400 },
          );
        }

        // Crear nuevo post
        const [newPost] = await db
          .insert(socialPosts)
          .values({
            title,
            baseText,
            status,
          })
          .returning();

        // Crear targets para cada plataforma
        if (platforms.length > 0) {
          await db.insert(socialPostTargets).values(
            platforms.map((p: any) => ({
              postId: newPost.id,
              platform: p.platform,
              variantText: p.variantText || baseText,
              status: p.status || status,
            })),
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            ...newPost,
            platforms: platforms.map((p: any) => p.platform),
          },
        });
      } catch (error) {
        logger.error("Error creating post", error);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to create post",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 },
        );
      }
    },
    { getTenantSlugFromUrl: true, logLevel: "info" },
  );
}
```

### 3. Refactor (Refactorización) - Mejorar el código

Una vez que la prueba pasa, mejora el código sin cambiar su comportamiento. Elimina duplicación, mejora la legibilidad, optimiza el rendimiento, etc.

**Ejemplo:**

```typescript
// apps/web/app/api/v1/social/queue/route.ts
export async function POST(request: NextRequest) {
  return withTenantContext(
    request,
    async (request, tenantId) => {
      try {
        const body = await request.json();
        const {
          id,
          title,
          baseText,
          status = "draft",
          scheduledAtUtc,
          timezone = "UTC",
          platforms = [],
          metadata,
          createdBy = "user",
        } = body;

        if (!baseText) {
          return NextResponse.json(
            { success: false, error: "baseText is required" },
            { status: 400 },
          );
        }

        // Función helper para crear targets
        const createTargets = (postId: string, platforms: any[]) => {
          if (platforms.length === 0) return;

          return db.insert(socialPostTargets).values(
            platforms.map((p: any) => ({
              postId,
              platform: p.platform,
              variantText: p.variantText || baseText,
              publishAtUtc: p.publishAtUtc
                ? new Date(p.publishAtUtc)
                : scheduledAtUtc
                  ? new Date(scheduledAtUtc)
                  : null,
              status: p.status || status,
              timezone,
            })),
          );
        };

        // Si ID es proporcionado, actualizar post existente
        if (id) {
          const [updatedPost] = await db
            .update(socialPosts)
            .set({
              title,
              baseText,
              status,
              scheduledAtUtc: scheduledAtUtc ? new Date(scheduledAtUtc) : null,
              timezone,
              metadata,
              updatedBy: createdBy,
              updatedAt: new Date(),
            })
            .where(eq(socialPosts.id, id))
            .returning();

          if (!updatedPost) {
            return NextResponse.json(
              { success: false, error: "Post not found" },
              { status: 404 },
            );
          }

          // Eliminar targets existentes y crear nuevos
          await db
            .delete(socialPostTargets)
            .where(eq(socialPostTargets.postId, id));
          await createTargets(id, platforms);

          return NextResponse.json({
            success: true,
            data: {
              ...updatedPost,
              platforms: platforms.map((p: any) => p.platform),
            },
          });
        }

        // Crear nuevo post
        const [newPost] = await db
          .insert(socialPosts)
          .values({
            title,
            baseText,
            status,
            scheduledAtUtc: scheduledAtUtc ? new Date(scheduledAtUtc) : null,
            timezone,
            createdBy,
            updatedBy: createdBy,
            metadata,
          })
          .returning();

        await createTargets(newPost.id, platforms);

        return NextResponse.json({
          success: true,
          data: {
            ...newPost,
            platforms: platforms.map((p: any) => p.platform),
          },
        });
      } catch (error) {
        logger.error("Error creating/updating post", error);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to create/update post",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 },
        );
      }
    },
    { getTenantSlugFromUrl: true, logLevel: "info" },
  );
}
```

## Estrategias de Pruebas

### 1. Pruebas Unitarias

Prueban unidades individuales de código en aislamiento.

**Cuándo usarlas:**

- Para probar lógica de negocio pura (sin dependencias externas).
- Para probar funciones helper.
- Para probar componentes UI en aislamiento.

**Ejemplo:**

```typescript
// tests/unit/tenant-context.test.ts
import { describe, it, expect } from "vitest";
import { AppLogger } from "@/lib/logger";

describe("AppLogger", () => {
  it("should create logger with default options", () => {
    const logger = new AppLogger();

    expect(logger).toBeDefined();
    // Más aserciones según el comportamiento esperado
  });

  it("should create logger with custom context", () => {
    const logger = new AppLogger({ context: "TestContext" });

    expect(logger).toBeDefined();
    // Más aserciones según el comportamiento esperado
  });
});
```

### 2. Pruebas de Integración

Prueban cómo interactúan múltiples componentes juntos.

**Cuándo usarlas:**

- Para probar flujos completos que involucran múltiples componentes.
- Para probar la interacción con la base de datos.
- Para probar APIs completas.

**Ejemplo:**

```typescript
// tests/integration/social-posts.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer } from "http";
import { parse } from "url";
import next from "next";

describe("Social Posts API Integration", () => {
  let server: any;
  let port: number;

  beforeAll(async () => {
    // Configurar servidor de prueba
    const app = next({ dev: false, port: 0 });
    const handle = app.getRequestHandler();

    server = createServer(async (req, res) => {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    });

    await new Promise((resolve) => {
      server.listen(0, () => {
        port = server.address().port;
        resolve(null);
      });
    });
  });

  afterAll(async () => {
    await server.close();
  });

  it("should create a post and retrieve it", async () => {
    // Crear un post
    const createResponse = await fetch(
      `http://localhost:${port}/api/v1/social/queue?tenant=test-tenant`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Integration Test Post",
          baseText: "This is an integration test post",
          status: "draft",
          platforms: [
            {
              platform: "facebook",
              variantText: "This is an integration test post",
            },
          ],
        }),
      },
    );

    expect(createResponse.status).toBe(200);
    const createData = await createResponse.json();
    expect(createData.success).toBe(true);

    // Recuperar el post
    const getResponse = await fetch(
      `http://localhost:${port}/api/v1/social/queue?tenant=test-tenant`,
    );
    expect(getResponse.status).toBe(200);

    const getData = await getResponse.json();
    expect(getData.success).toBe(true);
    expect(
      getData.data.some((post: any) => post.title === "Integration Test Post"),
    ).toBe(true);
  });
});
```

### 3. Pruebas End-to-End (E2E)

Prueban la aplicación desde la perspectiva del usuario, simulando interacciones reales.

**Cuándo usarlas:**

- Para probar flujos de usuario completos.
- Para probar escenarios críticos de negocio.
- Para probar la integración de toda la aplicación.

**Ejemplo:**

```typescript
// tests/e2e/social-creation.spec.ts
import { test, expect } from "@playwright/test";

test("user can create and edit a social media post", async ({ page }) => {
  // Iniciar sesión
  await page.goto("/login");
  await page.fill('[name="email"]', "test@example.com");
  await page.fill('[name="password"]', "password123");
  await page.click('button[type="submit"]');

  // Navegar a la página de social media
  await page.goto("/t/wondernails/social");

  // Crear nueva publicación
  await page.click('button:has-text("Nueva Publicación")');

  // Llenar formulario
  await page.fill('[name="title"]', "E2E Test Post");
  await page.fill('[name="content"]', "This is an E2E test post");
  await page.click('button:has-text("Guardar")');

  // Verificar que la publicación se creó
  await expect(page.locator("text=E2E Test Post")).toBeVisible();

  // Editar la publicación
  await page.click("text=E2E Test Post");
  await page.fill('[name="title"]', "E2E Test Post (Edited)");
  await page.click('button:has-text("Guardar")');

  // Verificar que la publicación se editó
  await expect(page.locator("text=E2E Test Post (Edited)")).toBeVisible();
});
```

## Buenas Prácticas TDD

### 1. Mantén las pruebas simples y enfocadas

Cada prueba debe probar una sola cosa. Si una prueba se vuelve demasiado compleja, divídela en pruebas más pequeñas.

**Mal ejemplo:**

```typescript
it("should create, update, delete and retrieve posts", async () => {
  // Demasiadas cosas en una sola prueba
});
```

**Buen ejemplo:**

```typescript
it("should create a new post", async () => {
  // Solo prueba la creación
});

it("should update an existing post", async () => {
  // Solo prueba la actualización
});

it("should delete a post", async () => {
  // Solo prueba la eliminación
});
```

### 2. Usa nombres de prueba descriptivos

Los nombres de las pruebas deben describir claramente qué se está probando y cuál es el resultado esperado.

**Mal ejemplo:**

```typescript
it("test post", () => {
  // ¿Qué se está probando exactamente?
});
```

**Buen ejemplo:**

```typescript
it("should create a post with required fields", () => {
  // Claramente indica qué se está probando y cuál es el resultado esperado
});
```

### 3. Usa fixtures y helpers

Evita la duplicación en tus pruebas usando fixtures y funciones helper.

**Ejemplo:**

```typescript
// tests/utils/fixtures.ts
export const createTestTenant = async () => {
  const [tenant] = await db
    .insert(tenants)
    .values({
      name: "Test Tenant",
      slug: "test-tenant",
      domain: "test.example.com",
    })
    .returning();

  return tenant;
};

export const createTestPost = async (tenantId: string, overrides = {}) => {
  const [post] = await db
    .insert(socialPosts)
    .values({
      tenantId,
      title: "Test Post",
      baseText: "This is a test post",
      status: "draft",
      ...overrides,
    })
    .returning();

  return post;
};
```

### 4. Mockea dependencias externas

Para pruebas unitarias, mockea dependencias externas como bases de datos, APIs externas, etc.

**Ejemplo:**

```typescript
import { vi } from "vitest";
import { db } from "@sass-store/database";

// Mock de la base de datos
vi.mock("@sass-store/database", () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));
```

### 5. Prueba casos límite y errores

No olvides probar casos límite y cómo se comporta tu código ante errores.

**Ejemplo:**

```typescript
it("should return error when creating post without baseText", async () => {
  const response = await POST({
    ...mockRequest,
    json: async () => ({ title: "Test Post" }), // Sin baseText
  } as NextRequest);

  expect(response.status).toBe(400);
  const data = await response.json();
  expect(data.success).toBe(false);
  expect(data.error).toBe("baseText is required");
});
```

## Flujo de Trabajo TDD en SASS Store

### 1. Planificación

Antes de empezar a escribir código, define qué quieres implementar. Crea una lista de los escenarios que necesitas probar.

**Ejemplo:**

- Como usuario, quiero crear una nueva publicación en redes sociales.
- Como usuario, quiero programar una publicación para una fecha futura.
- Como usuario, quiero editar una publicación existente.
- Como usuario, quiero eliminar una publicación.

### 2. Ciclo Red-Green-Refactor

Para cada escenario, sigue el ciclo Red-Green-Refactor:

1. **Red**: Escribe una prueba que defina el escenario y falle.
2. **Green**: Implementa el código mínimo para que la prueba pase.
3. **Refactor**: Mejora el código sin cambiar el comportamiento.

### 3. Integración Continua

Asegúrate de que todas las pruebas pasen en tu entorno local antes de hacer commit y push.

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar solo pruebas unitarias
npm run test:unit

# Ejecutar solo pruebas de integración
npm run test:integration

# Ejecutar solo pruebas E2E
npm run test:e2e
```

## Herramientas de Pruebas en SASS Store

- **Vitest**: Para pruebas unitarias y de integración.
- **Playwright**: Para pruebas E2E.
- **Testing Library**: Para pruebas de componentes React.
- **MSW (Mock Service Worker)**: Para mockear APIs en pruebas.

## Conclusión

TDD es una práctica poderosa que mejora la calidad del código, reduce los bugs y facilita el mantenimiento. Al seguir el ciclo Red-Green-Refactor y las buenas prácticas descritas en esta guía, podrás desarrollar features más robustos y confiables en SASS Store.

Recuerda: el objetivo de TDD no es escribir pruebas, sino escribir mejor código a través de las pruebas.
