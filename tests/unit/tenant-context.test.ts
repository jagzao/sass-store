// Using globals instead of imports since globals: true in Vitest config
import { vi } from 'vitest';
import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/db/tenant-context";
import { db } from "@sass-store/database";

const { mockAuth } = vi.hoisted(() => {
  return { mockAuth: vi.fn() };
});

// Mock de la base de datos
vi.mock("@sass-store/database", () => ({
  db: {
    select: vi.fn(),
    execute: vi.fn(),
  },
}));

vi.mock("@sass-store/database/schema", () => ({
  tenants: {
    id: "id",
    slug: "slug",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(() => ({ mocked: "eq" })),
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    strings,
    values,
  }),
}));

// Mock del logger
vi.mock("@/lib/logger", () => ({
  logger: {
    withContext: vi.fn(() => ({
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

describe("withTenantContext", () => {
  let mockRequest: NextRequest;
  let mockHandler: ReturnType<typeof vi.fn>;
  let mockDb: any;

  const createMockRequest = (url: string, tenantHeader: string | null = null) =>
    ({
      url,
      headers: {
        get: vi.fn((name: string) =>
          name === "x-tenant-slug" ? tenantHeader : null,
        ),
      },
    }) as unknown as NextRequest;

  beforeEach(() => {
    vi.clearAllMocks();

    // Configurar mock de la solicitud
    mockRequest = createMockRequest("http://localhost:3000/api/v1/products");

    // Configurar mock del handler
    mockHandler = vi
      .fn()
      .mockResolvedValue(NextResponse.json({ success: true }));

    // Configurar mock de la base de datos
    mockDb = db as any;
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: "tenant-uuid-123" }]),
        }),
      }),
    });

    mockDb.execute.mockResolvedValue({});
  });

  it("debería establecer el contexto de tenant y ejecutar el handler", async () => {
    // Mock de la sesión
    mockAuth.mockResolvedValue({
      user: {
        tenantSlug: "test-tenant",
      },
    });

    const result = await withTenantContext(mockRequest, mockHandler);

    expect(result).toBeDefined();
    expect(mockHandler).toHaveBeenCalledWith(mockRequest, "tenant-uuid-123");

    expect(mockDb.execute).toHaveBeenCalled();
  });

  it("debería retornar error 404 si no se encuentra el tenant", async () => {
    // Mock de la sesión
    mockAuth.mockResolvedValue({
      user: {
        tenantSlug: "non-existent-tenant",
      },
    });

    // Configurar mock para que no encuentre el tenant
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const result = await withTenantContext(mockRequest, mockHandler);

    expect(result.status).toBe(404);
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it("debería manejar errores en la ejecución del handler", async () => {
    // Mock de la sesión
    mockAuth.mockResolvedValue({
      user: {
        tenantSlug: "test-tenant",
      },
    });

    // Configurar mock para que el handler lance un error
    mockHandler.mockRejectedValue(new Error("Test error"));

    const result = await withTenantContext(mockRequest, mockHandler);

    expect(result.status).toBe(500);
  });

  it("debería manejar errores al establecer el contexto de tenant", async () => {
    // Mock de la sesión
    mockAuth.mockResolvedValue({
      user: {
        tenantSlug: "test-tenant",
      },
    });

    // Configurar mock para que falle la ejecución del contexto
    mockDb.execute.mockRejectedValue(new Error("Context error"));

    const result = await withTenantContext(mockRequest, mockHandler);

    expect(result.status).toBe(500);
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it("debería extraer tenantSlug de la URL cuando se especifica", async () => {
    // Configurar mock de la solicitud con URL que contiene tenant
    mockRequest = createMockRequest(
      "http://localhost:3000/t/test-tenant/api/v1/products",
    );

    const result = await withTenantContext(mockRequest, mockHandler, {
      getTenantSlugFromUrl: true,
      requireAuth: false,
    });

    expect(result).toBeDefined();
    expect(mockHandler).toHaveBeenCalledWith(mockRequest, "tenant-uuid-123");
  });

  it("debería retornar error 404 si no se encuentra tenantSlug en la URL", async () => {
    // Configurar mock de la solicitud sin tenant en la URL
    mockRequest = createMockRequest("http://localhost:3000/api/v1/products");

    const result = await withTenantContext(mockRequest, mockHandler, {
      getTenantSlugFromUrl: true,
      requireAuth: false,
    });

    expect(result.status).toBe(404);
    expect(mockHandler).not.toHaveBeenCalled();
  });
});
