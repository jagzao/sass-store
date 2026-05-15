// Mock Database Helper
// Este módulo proporciona mocks para tests unitarios sin conexión a DB externa.
// Reemplaza acceso directo a Drizzle/Prisma en archivos .spec.ts
//
// Uso automático por el orquestador cuando encuentra timeouts de Supabase.
// También se puede usar manualmente en tests que no requieren datos reales.

import { vi } from "vitest";

// Helper para crear una instancia mock del cliente DB
export function createMockDb(overrides: Record<string, any> = {}) {
  const mockClient = vi.fn((query) => Promise.resolve([]));
  const mockExecute = vi.fn((query) => Promise.resolve([]));
  const mockSelect = vi.fn(() => Promise.resolve([]));
  const mockInsert = vi.fn(() => Promise.resolve([]));
  const mockUpdate = vi.fn(() => Promise.resolve([]));
  const mockDelete = vi.fn(() => Promise.resolve([]));

  return {
    client: mockClient,
    execute: mockExecute,
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    // Helpers para configurar respuestas mock
    mockTable: (tableName: string) => {
      const chain = {
        findMany: vi.fn((...args) => chain._findMany(...args)),
        findFirst: vi.fn((...args) => chain._findFirst(...args)),
        findUnique: vi.fn((...args) => chain._findUnique(...args)),
        create: vi.fn((...args) => chain._create(...args)),
        update: vi.fn((...args) => chain._update(...args)),
        delete: vi.fn((...args) => chain._delete(...args)),
        count: vi.fn((...args) => chain._count(...args)),
        // Storage para respuestas configuradas
        _findMany: vi.fn(),
        _findFirst: vi.fn(),
        _findUnique: vi.fn(),
        _create: vi.fn(),
        _update: vi.fn(),
        _delete: vi.fn(),
        _count: vi.fn(),
      };
      return chain;
    },
    ...overrides,
  };
}

// Mock de la conexión Drizzle genérica
export const mockDrizzleDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnValue([]),
  where: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
};

// Auto-recovery handler para timeouts de Supabase
// El orquestador lo usa automáticamente cuando detecta timeouts en tests .test.ts legacy
export const handleSupabaseTimeout = () => {
  console.log(
    "🔁 Auto-recovery: Timeout de Supabase detectado. Sugerencia: migrar .test.ts a .spec.ts con mocks",
  );
  // Esta función se llama desde el ciclo de autocorrección del orquestador
  // cuando se detectan timeouts masivos en tests legacy
};

// Patrón de uso en tests:
// vi.mock('@/lib/db', () => mockDrizzleDb);
