# Protocolo de Testing

> **Versión:** 1.0.0  
> **Última actualización:** 2026-03-02  
> **Proyecto:** sass-store  

---

## Propósito

Este protocolo define las reglas y estándares para testing en sass-store, asegurando calidad y prevención de regresiones.

---

## 1. Estructura de Tests

### 1.1 Organización de Directorios

```
tests/
├── unit/                    # Tests unitarios (aislados)
│   ├── services/           # Tests de servicios
│   ├── utils/              # Tests de utilidades
│   └── validation/         # Tests de validación
├── integration/             # Tests de integración (con DB)
│   ├── api/                # Tests de endpoints
│   ├── db/                 # Tests de base de datos
│   └── tenant-isolation.spec.ts
├── e2e/                     # Tests end-to-end (Playwright)
│   ├── auth.spec.ts
│   ├── booking.spec.ts
│   └── admin.spec.ts
└── utils/                   # Fixtures y helpers
    ├── fixtures.ts
    ├── builders.ts
    └── test-db.ts
```

### 1.2 Convenciones de Nombres

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Unit | `*.spec.ts` | `product-service.spec.ts` |
| Integration | `*.spec.ts` | `booking-api.spec.ts` |
| E2E | `*.spec.ts` | `checkout-flow.spec.ts` |
| Fixtures | `*.ts` | `fixtures.ts` |
| Builders | `*.ts` | `data-builders.ts` |

---

## 2. Tests Unitarios

### 2.1 Estructura de Test

```typescript
// tests/unit/services/product-service.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createProduct, getProduct, updateProduct } from '@/lib/services/product-service';
import { expectSuccess, expectFailure } from '../../utils/helpers';

describe('ProductService', () => {
  describe('createProduct', () => {
    it('should create product with valid data', async () => {
      // Arrange
      const data = { name: 'Test Product', price: 100 };
      const context = { tenantId: 'tenant-123', userId: 'user-456' };

      // Act
      const result = await createProduct(data, context);

      // Assert
      expectSuccess(result);
      expect(result.value.name).toBe('Test Product');
      expect(result.value.tenantId).toBe('tenant-123');
    });

    it('should return ValidationError for invalid price', async () => {
      // Arrange
      const data = { name: 'Test Product', price: -10 };
      const context = { tenantId: 'tenant-123', userId: 'user-456' };

      // Act
      const result = await createProduct(data, context);

      // Assert
      expectFailure(result);
      expect(result.error.type).toBe('ValidationError');
    });
  });

  describe('getProduct', () => {
    it('should return NotFoundError for non-existent product', async () => {
      // Arrange
      const productId = 'non-existent-id';
      const tenantId = 'tenant-123';

      // Act
      const result = await getProduct(productId, tenantId);

      // Assert
      expectFailure(result);
      expect(result.error.type).toBe('NotFoundError');
    });
  });
});
```

### 2.2 Mocking

```typescript
// Mock de dependencias
vi.mock('@/lib/db', () => ({
  db: {
    products: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }
  }
}));

// Uso en test
it('should call database with correct parameters', async () => {
  // Arrange
  const mockCreate = vi.mocked(db.products.create);
  mockCreate.mockResolvedValueOnce({ id: '1', name: 'Test' });

  // Act
  await createProduct({ name: 'Test' }, context);

  // Assert
  expect(mockCreate).toHaveBeenCalledWith({
    data: {
      name: 'Test',
      tenantId: context.tenantId
    }
  });
});
```

---

## 3. Tests de Integración

### 3.1 Configuración de DB de Prueba

```typescript
// tests/utils/test-db.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/lib/db/schema';

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL!;

let testDb: ReturnType<typeof drizzle>;

export const getTestDb = () => {
  if (!testDb) {
    const client = postgres(TEST_DATABASE_URL);
    testDb = drizzle(client, { schema });
  }
  return testDb;
};

export const cleanupTestDb = async () => {
  const db = getTestDb();
  await db.delete(schema.bookings);
  await db.delete(schema.customers);
  await db.delete(schema.products);
  await db.delete(schema.services);
  // ... otras tablas
};

export const seedTestDb = async () => {
  const db = getTestDb();
  // Crear tenant de prueba
  await db.insert(schema.tenants).values({
    id: 'test-tenant-1',
    name: 'Test Tenant',
    slug: 'test-tenant',
  });
  // ... más seed data
};
```

### 3.2 Test de Integración

```typescript
// tests/integration/api/products-api.spec.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET, POST } from '@/app/api/products/route';
import { cleanupTestDb, seedTestDb } from '../../utils/test-db';
import { createAuthenticatedRequest } from '../../utils/helpers';

describe('Products API', () => {
  beforeEach(async () => {
    await cleanupTestDb();
    await seedTestDb();
  });

  afterEach(async () => {
    await cleanupTestDb();
  });

  describe('GET /api/products', () => {
    it('should return products for authenticated tenant', async () => {
      // Arrange
      const request = createAuthenticatedRequest('/api/products', {
        tenantId: 'test-tenant-1'
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should return 401 for unauthenticated request', async () => {
      // Arrange
      const request = new Request('/api/products');

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/products', () => {
    it('should create product with valid data', async () => {
      // Arrange
      const body = { name: 'New Product', price: 100 };
      const request = createAuthenticatedRequest('/api/products', {
        tenantId: 'test-tenant-1',
        method: 'POST',
        body
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('New Product');
    });
  });
});
```

---

## 4. Tests E2E

### 4.1 Configuración Playwright

```typescript
// tests/e2e/auth.setup.ts
import { test as setup } from '@playwright/test';
import { prisma } from '@/lib/db';

setup('authenticate', async ({ page }) => {
  // Crear usuario de prueba
  const testUser = await prisma.users.create({
    data: {
      email: 'test@example.com',
      // ...
    }
  });

  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Guardar estado
  await page.context().storageState({ path: 'tests/e2e/.auth/user.json' });
});
```

### 4.2 Test E2E

```typescript
// tests/e2e/booking-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test.use({ storageState: 'tests/e2e/.auth/user.json' });

  test('should complete a booking successfully', async ({ page }) => {
    // Navigate to tenant dashboard
    await page.goto('/t/test-tenant/dashboard');

    // Go to bookings
    await page.click('text=Reservas');
    await expect(page).toHaveURL(/.*bookings/);

    // Create new booking
    await page.click('text=Nueva Reserva');

    // Fill form
    await page.selectOption('#service', 'Corte de Cabello');
    await page.fill('#date', '2026-03-15');
    await page.fill('#time', '10:00');
    await page.selectOption('#customer', 'Juan Pérez');

    // Submit
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('text=Reserva creada')).toBeVisible();
  });

  test('should show error for conflicting booking', async ({ page }) => {
    // ... test para conflicto de horario
  });
});
```

---

## 5. Helpers y Fixtures

### 5.1 Data Builders

```typescript
// tests/utils/builders.ts
import { v4 as uuidv4 } from 'uuid';

export const ProductBuilder = {
  build: (overrides: Partial<Product> = {}) => ({
    id: uuidv4(),
    name: 'Default Product',
    price: 100,
    tenantId: 'default-tenant',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  withTenant: (tenantId: string) => ProductBuilder.build({ tenantId }),
  
  withPrice: (price: number) => ProductBuilder.build({ price }),
  
  buildMany: (count: number, overrides: Partial<Product> = {}) => 
    Array.from({ length: count }, () => ProductBuilder.build(overrides))
};

export const BookingBuilder = {
  build: (overrides: Partial<Booking> = {}) => ({
    id: uuidv4(),
    date: new Date(),
    status: 'pending',
    tenantId: 'default-tenant',
    ...overrides
  }),
  // ...
};
```

### 5.2 Helpers de Result Pattern

```typescript
// tests/utils/helpers.ts
import { expect } from 'vitest';
import { Result } from '@sass-store/core/src/result';

export const expectSuccess = <T, E>(result: Result<T, E>): T => {
  if (result.isErr()) {
    throw new Error(`Expected success but got error: ${result.error}`);
  }
  return result.value;
};

export const expectFailure = <T, E>(result: Result<T, E>): E => {
  if (result.isOk()) {
    throw new Error(`Expected failure but got success: ${result.value}`);
  }
  return result.error;
};

export const expectErrorType = <T, E>(
  result: Result<T, E>, 
  errorType: string
) => {
  const error = expectFailure(result);
  expect(error.type).toBe(errorType);
  return error;
};
```

---

## 6. Cobertura de Tests

### 6.1 Requisitos Mínimos

| Tipo de Código | Cobertura | Crítico |
|----------------|-----------|---------|
| Servicios de dominio | 80% | ✅ |
| API routes | 70% | ✅ |
| Validación | 90% | ✅ |
| Utilidades | 90% | ✅ |
| Componentes UI | 60% | ⚠️ |
| Hooks | 80% | ✅ |

### 6.2 Comandos de Cobertura

```bash
# Cobertura de tests unitarios
npm run test:unit -- --coverage

# Cobertura de tests de integración
npm run test:integration -- --coverage

# Reporte combinado
npm run test:unit -- --coverage && npm run test:integration -- --coverage
```

### 6.3 Configuración de Cobertura

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80
      }
    }
  }
});
```

---

## 7. Tests Obligatorios por Feature

### 7.1 Checklist de Tests

Para cada nuevo feature, verificar:

```markdown
## Tests para [Feature Name]

### Unit Tests
- [ ] Test de caso exitoso (happy path)
- [ ] Test de validación de input
- [ ] Test de errores de negocio
- [ ] Test de edge cases

### Integration Tests
- [ ] Test de endpoint/route
- [ ] Test de persistencia en DB
- [ ] Test de aislamiento multitenant

### E2E Tests (si aplica)
- [ ] Test de flujo completo en UI
- [ ] Test de error handling en UI
```

### 7.2 Template de Test Suite

```typescript
// tests/unit/services/[feature]-service.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';

describe('[Feature]Service', () => {
  // ============================================
  // HAPPY PATH
  // ============================================
  describe('happy path', () => {
    it('should [action] successfully', async () => {
      // ...
    });
  });

  // ============================================
  // VALIDATION
  // ============================================
  describe('validation', () => {
    it('should reject invalid [field]', async () => {
      // ...
    });
  });

  // ============================================
  // BUSINESS RULES
  // ============================================
  describe('business rules', () => {
    it('should enforce [rule]', async () => {
      // ...
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================
  describe('edge cases', () => {
    it('should handle [edge case]', async () => {
      // ...
    });
  });

  // ============================================
  // SECURITY
  // ============================================
  describe('security', () => {
    it('should prevent unauthorized access', async () => {
      // ...
    });

    it('should isolate tenant data', async () => {
      // ...
    });
  });
});
```

---

## 8. CI/CD Integration

### 8.1 Pipeline de Tests

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:integration
        env:
          TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install
      - run: npm run build
      - run: npm run test:e2e
```

### 8.2 Pre-commit Hooks

```yaml
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run linting
npm run lint

# Run affected unit tests
npm run test:unit -- --related $(git diff --name-only HEAD^)
```

---

## 9. Debugging de Tests

### 9.1 Comandos Útiles

```bash
# Ejecutar un test específico
npm run test:unit -- product-service.spec.ts

# Ejecutar con verbose
npm run test:unit -- --reporter=verbose

# Ejecutar tests que coinciden con patrón
npm run test:unit -- --grep "should create"

# Debug con Node inspector
npm run test:unit -- --inspect-brk

# Update snapshots
npm run test:unit -- -u
```

### 9.2 Logs en Tests

```typescript
// Usar screen.debug() en tests de componentes
screen.debug();

// Usar console.log con contexto
console.log('🔍 Test context:', { tenantId, productId });

// Usar page.pause() en E2E para debug interactivo
await page.pause();
```

---

## 10. Referencias

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [test_cases.md](../history/test_cases.md)

---

*Este protocolo es obligatorio. Todo código nuevo debe incluir tests según estas especificaciones.*
