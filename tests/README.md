# Test Infrastructure

This directory contains the test suite for the Sass Store platform.

## Structure

```
tests/
├── setup/                 # Test configuration and setup
│   ├── vitest.setup.ts   # Global test setup
│   ├── test-database.ts  # Database helpers
│   └── README.md
├── mocks/                 # Mock implementations
│   └── redis.mock.ts     # Redis/Upstash mock
├── unit/                  # Unit tests
│   ├── cart-operations.test.ts
│   ├── logger.spec.ts
│   └── alerts.spec.ts
├── security/              # Security tests (RLS, auth, etc.)
│   └── rls.test.ts
├── integration/           # Integration tests
│   └── api/
├── e2e/                   # End-to-end tests (Playwright)
│   ├── auth/
│   ├── cart/
│   └── booking/
└── api/                   # API tests
    └── reviews.test.ts
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (development)
```bash
npm run test:watch
```

### With UI
```bash
npm run test:ui
```

### Specific Test Suites
```bash
# Unit tests only
npm run test:unit

# Security tests
npm run test:security

# Integration tests
npm run test:integration

# E2E tests (Playwright)
npm run test:e2e
```

### Coverage
```bash
npm run test:coverage
```

## Test Database

Tests use a separate test database to avoid affecting production/development data.

### Configuration

Set the `TEST_DATABASE_URL` environment variable:

```bash
# .env.test
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/sass_store_test
```

If `TEST_DATABASE_URL` is not set, it falls back to `DATABASE_URL`.

### Helpers

The test database helpers are available in `tests/setup/test-database.ts`:

```typescript
import {
  getTestDb,
  createTestTenant,
  createTestProduct,
  createTestService,
  createTestUser,
} from '../setup/test-database';

// Use in your tests
const tenant = await createTestTenant();
const product = await createTestProduct(tenant.id);
```

### Cleanup

- `beforeAll`: Sets up the database connection
- `afterEach`: Cleans up test data (truncates tables)
- `afterAll`: Closes database connection

## Mocks

### Redis Mock

For testing code that uses Redis/Upstash:

```typescript
import { createMockRedis } from '../mocks/redis.mock';

const redis = createMockRedis();
await redis.set('key', 'value');
const value = await redis.get('key');
```

The mock implements common Redis commands:
- `get`, `set`, `del`
- `incr`, `incrby`, `decr`
- `expire`, `ttl`
- `hset`, `hget`, `hgetall`
- `mget`, `mset`
- Hash operations

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { getTestDb, createTestTenant } from '../setup/test-database';

describe('Feature Name', () => {
  let tenant: Awaited<ReturnType<typeof createTestTenant>>;

  beforeEach(async () => {
    tenant = await createTestTenant();
  });

  it('should do something', async () => {
    const db = getTestDb();
    // ... test code
    expect(result).toBe(expected);
  });
});
```

### Testing RLS (Row Level Security)

See `tests/security/rls.test.ts` for examples:

```typescript
it('should only return products for the specified tenant', async () => {
  const db = getTestDb();

  await createTestProduct(tenant1.id, { name: 'Product 1' });
  await createTestProduct(tenant2.id, { name: 'Product 2' });

  const tenant1Products = await db
    .select()
    .from(products)
    .where(eq(products.tenantId, tenant1.id));

  expect(tenant1Products).toHaveLength(1);
});
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Use `afterEach` to clean up test data
3. **Naming**: Use descriptive test names that explain what is being tested
4. **Arrange-Act-Assert**: Structure tests clearly:
   ```typescript
   it('should calculate cart total', async () => {
     // Arrange
     const product = await createTestProduct(tenant.id);

     // Act
     const total = calculateTotal(cart);

     // Assert
     expect(total).toBe(199.99);
   });
   ```
5. **Performance**: Tests should run quickly (<1s per test when possible)
6. **Coverage**: Aim for:
   - Critical paths: >80%
   - Business logic: >70%
   - UI components: >60%

## Debugging Tests

### Run specific test file
```bash
npm test tests/unit/cart-operations.test.ts
```

### Run tests matching pattern
```bash
npm test -- --grep "should add product"
```

### Verbose output
```bash
npm test -- --reporter=verbose
```

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Pushes to main branch
- Before deployment

## Troubleshooting

### Database connection issues

```bash
# Check if test database exists
psql -h localhost -U user -l | grep sass_store_test

# Create test database if needed
createdb sass_store_test
```

### Tests timing out

Increase timeout in `vitest.config.ts`:
```typescript
export default defineConfig({
  test: {
    testTimeout: 20000, // 20 seconds
  },
});
```

### Clean test database manually

```bash
npm run db:push -- --url $TEST_DATABASE_URL
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Drizzle ORM Testing](https://orm.drizzle.team/docs/overview)
- [Playwright Documentation](https://playwright.dev/)
