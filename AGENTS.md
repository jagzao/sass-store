# Repository Guidelines

## Project Structure & Module Organization

- Use the Turbo workspace layout: `apps/web` for the Next.js App Router UI (port 3001) and `apps/api` for the HTTP API (port 4000).
- Keep routes under `apps/web/app/**`, shared widgets inside `apps/web/components/**`, API handlers in `apps/api/app/api/**`, and domain services under `apps/api/lib/**`.
- Reusable schema, UI primitives, and configs belong inside `packages/*`; update them first, then propagate changes into individual apps.
- Tests live in `tests/{unit,integration,e2e}` with fixtures at `tests/utils`; migrations, automation, and docs stay in `migrations/`, `commands/`, `tools/`, and `docs/`.

## Result Pattern Implementation

**🔥 MANDATORY: All new code must use Result Pattern for error handling**

### Core Principles

1. **No more try/catch in business logic** - Use Result<T, E> pattern instead
2. **Explicit error types** - All errors must be typed DomainError variants
3. **Composable operations** - Chain Results with map, flatMap, and combinators
4. **Type-safe validation** - Use Zod schemas with Result integration

### Required Imports

```typescript
// Core Result pattern
import { Result, Ok, Err, match } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import {
  validateWithZod,
  CommonSchemas,
} from "@sass-store/validation/src/zod-result";
```

### Standard Patterns

#### ✅ CORRECT: Result Pattern

```typescript
// API Route
export const GET = withResultHandler(
  async (request): Promise<Result<Product, DomainError>> => {
    return await getProduct(id)
      .flatMap(validateProduct)
      .flatMap(checkPermissions);
  },
);

// Service Layer
export const getProduct = (
  id: string,
): Promise<Result<Product, DomainError>> => {
  return fromPromise(db.products.findUnique({ where: { id } }), (error) =>
    ErrorFactories.database(
      "find_product",
      `Failed to find product ${id}`,
      undefined,
      error,
    ),
  );
};

// Validation
const validateProduct = (
  product: Product,
): Result<Product, ValidationError> => {
  return validateWithZod(ProductSchema, product);
};
```

#### ❌ FORBIDDEN: Old try/catch

```typescript
// DO NOT USE THIS PATTERN
export async function GET(request: NextRequest) {
  try {
    const product = await getProduct(id);
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
```

### Error Handling Rules

1. **Always use typed errors**: Never return raw `Error` objects
2. **Use appropriate error factories**: `ErrorFactories.notFound()`, `ErrorFactories.validation()`, etc.
3. **Match Results explicitly**: Use `match()` for branching logic
4. **Log with context**: Use `logResult()` for consistent logging

## Build, Test, and Development Commands

- `npm run dev -- --filter=@sass-store/web` boots only the web UI; drop the filter to start all workspaces.
- `npm run build`, `npm run lint`, and `npm run typecheck` are mandatory before any PR.
- Test with `npm run test[:unit|:integration|:e2e]`; narrow Playwright via `npm run test:e2e:subset -- --grep "booking"`.
- Run `npm run db:generate`, `npm run db:push`, and `npm run db:seed` from `apps/api` whenever schema changes land.

## Coding Style & Naming Conventions

- TypeScript is strict with 2-space indentation, trailing commas, and formatting enforced by `npx prettier --write`.
- Components use PascalCase filenames, hooks start with `use`, helpers stay camelCase, and constants use UPPER_SNAKE_CASE.
- Keep server-only logic in `app/(...)/route.ts` files, avoid `any`, prefer Result<T, E> pattern, and export types separately for treeshaking.

### Result Pattern Naming

- **Service functions**: Return `Result<T, DomainError>`
- **API handlers**: Use `withResultHandler()` middleware
- **Validation**: Use `validateWithZod()` or `CommonSchemas`
- **Error types**: Import from `ErrorFactories`
- **Combinators**: Use `pipe()`, `map()`, `flatMap()` for chaining

## Testing Guidelines

### Result Pattern Testing

- **Test both success and failure paths**: Always test Result branches
- **Use expectSuccess/expectFailure**: Helper functions for testing Results
- **Mock error scenarios**: Test DomainError variants
- **Use data builders**: Avoid brittle hardcoded test data

```typescript
describe("Product Service", () => {
  it("should return product when found", async () => {
    const result = await getProduct("valid-id");
    expectSuccess(result).toEqual(expectedProduct);
  });

  it("should return NotFoundError when product missing", async () => {
    const result = await getProduct("invalid-id");
    expectFailure(result).toEqual(
      expect.objectContaining({
        type: "NotFoundError",
        resource: "Product",
      }),
    );
  });
});
```

- Vitest specs live in `tests/{unit,integration}` as `*.spec.ts`; Playwright targets port 3001 and writes artifacts to `test-results/`.
- Maintain >=80% logic coverage and log plan changes in `TESTING_IMPLEMENTATION_SUMMARY.md`.
- Use fixtures from `tests/utils`, stub API calls through `apps/api/lib/**`, and favor data builders over brittle IDs.

## Migration Strategy

### Phase 1: New Code (Immediate)

- All new features MUST use Result Pattern
- Update AGENTS.md examples as code is written
- Refactor only when touching existing files

### Phase 2: Critical Paths (Next Sprint)

- High-traffic API endpoints
- Authentication and authorization flows
- Payment and billing operations

### Phase 3: Complete Migration (Following Sprints)

- All API routes
- Service layer functions
- Validation logic

### Migration Checklist

For each file migrated:

- [ ] Replace try/catch with Result<T, E>
- [ ] Import required Result pattern utilities
- [ ] Use typed error factories
- [ ] Update tests to use expectSuccess/expectFailure
- [ ] Verify middleware integration
- [ ] Update documentation

## Commit & Pull Request Guidelines

- Follow Conventional Commits (example: `feat(auth): add OAuth2 flow with Result pattern`) and mention the primary test command executed.
- PRs must satisfy `.github/pull_request_template.md`: declare type, severity, scope, link any plan artifacts, attach `agents/bundles/{id}` bundles, list risks, and include UI screenshots when relevant.
- **Result Pattern compliance is mandatory** - PRs with old try/catch patterns will be rejected
- Never push directly to `main`; open PRs only after `npm run build`, `npm run lint`, and targeted suites pass.

## Security & Agent Workflow Tips

- Keep secrets out of git, copy `.env.example` into `.env.local`, enforce tenant isolation with RLS filters, and sanitize rendered HTML.
- Run `npm run security:autofix` before releases and avoid storing credentials in fixtures or docs.
- Start automation with `npm run swarm:start "<feature name>"` so PM -> Architect -> QA -> Security agents ship assets in `docs/prd/` and `agents/bundles/`.

### Result Pattern Security Benefits

- **Explicit error boundaries**: No exception leaks
- **Sanitized error messages**: User-safe error responses
- **Audit-friendly**: All errors are logged with context
- **Type-safe validation**: Prevents injection attacks

## Performance Guidelines

### Result Pattern Performance

- **Use combinators efficiently**: Chain operations to avoid nested matches
- **Lazy error creation**: Use ErrorFactories for error construction
- **Cache Results**: Use `ResultCache` for expensive operations
- **Async chaining**: Use `asyncFlatMap()` for async operations

```typescript
// Efficient chaining
const result = await pipe(getUser(id))
  .flatMap(validateUser)
  .flatMap(checkPermissions)
  .flatMap(loadUserData);

// With caching
const userCache = new ResultCache<string, User, DomainError>(300000); // 5 minutes
const cachedUser = await userCache.getOrCompute(id, () => getUser(id));
```

## Debugging & Monitoring

### Result Pattern Debugging

- **Use structured logging**: All Result operations support logging
- **Track error chains**: Use tap/tapError for debugging
- **Monitor performance**: Use withPerformanceTracking wrapper
- **Error aggregation**: Use combineAll for batch operations

```typescript
// Debugging Result chain
const result = await pipe(getProduct(id))
  .tap((product) => console.log("Product loaded:", product.id))
  .tapError((error) => console.error("Product load failed:", error.type))
  .flatMap(validateProduct);

// Performance monitoring
const trackedOperation = withPerformanceTracking(expensiveOperation, {
  name: "product-load",
  threshold: 1000,
});
```

## Agent-Specific Guidelines

### Product Manager (PM)

- **Ensure Result Pattern compliance** in feature requirements
- **Plan migration capacity** for Result Pattern adoption
- **Validate error handling UX** in mockups

### Architect Agent

- **Design Result Pattern flows** for all new features
- **Create DomainError variants** for business logic
- **Validate Result chain compositions**

### Developer Agent

- **Implement Result Pattern strictly** - no exceptions
- **Use proper error factories** and combinators
- **Write comprehensive Result tests**

### QA Agent

- **Test both success/failure paths** thoroughly
- **Verify error messages** are user-friendly
- **Test error boundaries** and edge cases

### Security Agent

- **Validate no exception leaks** in error responses
- **Check error sanitization** in API responses
- **Audit DomainError types** for information disclosure

---

**🚨 CRITICAL: Compliance with the Result Pattern is mandatory for all new code. PRs violating these guidelines will be automatically rejected.**

The Result Pattern provides:

- ✅ Type-safe error handling
- ✅ Explicit control flow
- ✅ Composable operations
- ✅ Better testing capabilities
- ✅ Improved debugging
- ✅ Security benefits
- ✅ Performance optimization opportunities
