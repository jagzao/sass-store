---
name: feature-developer
description: Autonomous feature development for this workspace. Use when Codex must implement a new feature or substantial product change in sass-store, including planning, Result Pattern business logic, tests, validation, and an optional Playwright demo.
---

# Feature Developer

Use this skill to implement complete features in the sass-store monolith while preserving repository conventions, Result Pattern error handling, multitenant isolation, and test coverage.

## Initial Read

Read only the files needed for the task, starting with:

- `.agents/sprint/{STRY-XXX-*}/plan.md`, `implementacion.md`, and `testing-usuario.md` when the work maps to an active User Story. If the user asks for a **robust plan** / **robust testing** / **exhaustive QA**, extend those docs per `AGENTS.md` (Plan robusto de testing: crawler, negative paths, multitenant matrix) and `docs/TESTING_MASTER_PLAN.md` §12.1+.
- `.agents/history/debug_logs.md` for known recurring failures.
- `.agents/history/test_cases.md` for relevant edge cases.
- `.agents/memory/context_be.md` for backend rules.
- `.agents/session/current_task.md` for current session state.

If a referenced file is not relevant to the feature, skip it and keep context small.

## Planning

Create or update the task plan before editing code:

```markdown
## Feature: [name]

### Goal

[clear implementation goal]

### Files to Create

- [ ] `apps/web/lib/[domain]/[feature].ts`
- [ ] `apps/web/app/api/[route]/route.ts`
- [ ] `apps/web/components/[feature].tsx`
- [ ] `tests/unit/[feature].spec.ts`
- [ ] `tests/e2e/[feature].spec.ts`

### Files to Modify

- [ ] [path]

### Acceptance Criteria

- [ ] [criterion]

### Required Tests

- [ ] Unit: [cases]
- [ ] Integration: [cases]
- [ ] E2E: [cases]
```

## Implementation Order

Implement by layers:

1. Database, when required: schema, migration, seed.
2. Backend: types, service, API route.
3. Frontend: components, pages, integration.
4. Tests: unit, integration, E2E.

Keep new business logic on the Result Pattern:

- Return `Result<T, DomainError>` from services.
- Use typed errors from `ErrorFactories`.
- Use `validateWithZod` or shared schemas for input validation.
- Avoid `try/catch` in business logic. Use Result helpers such as `fromPromise`, `map`, `flatMap`, `asyncFlatMap`, and `match`.
- Use `withResultHandler()` for API handlers when the local route pattern supports it.

## Validation Loop

After meaningful changes, run the narrowest useful checks first:

```bash
npm run lint
npm run typecheck
npm run test:unit -- --grep "[feature]"
```

When a test fails:

1. Capture the failing command and error.
2. Identify the root cause.
3. Patch the smallest relevant code path.
4. Re-run the failing command.
5. Record new recurring failures in `.agents/history/debug_logs.md` when useful.

Stop after five unsuccessful attempts on the same failure and report the blocker clearly.

## Final Verification

Before closing a complete feature, run the checks appropriate to the blast radius:

```bash
npm run lint
npm run typecheck
npm run build
npm run test:unit
npm run test:integration
npm run test:e2e:subset -- --grep "[feature]"
```

If a command cannot be run, explain why and name the residual risk.

## Optional Demo

When the request asks for a demo, add a focused Playwright scenario under `tests/e2e/demo/` and run it with video enabled:

```bash
npx playwright test tests/e2e/demo/[feature]-demo.spec.ts --video=on
```

## Code Templates

### Service

```typescript
import { Result, Err, Ok } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import { validateWithZod } from "@sass-store/validation/src/zod-result";

export const createFeature = async (
  data: CreateFeatureInput,
  context: { tenantId: string; userId: string },
): Promise<Result<Feature, DomainError>> => {
  const validation = validateWithZod(CreateFeatureSchema, data);
  if (validation.isErr()) {
    return validation;
  }

  return fromPromise(
    db.features.create({
      data: {
        ...validation.value,
        tenantId: context.tenantId,
        createdBy: context.userId,
      },
    }),
    (error) =>
      ErrorFactories.database(
        "create_feature",
        "Failed to create feature",
        undefined,
        error,
      ),
  );
};
```

### API Route

```typescript
import { NextRequest } from "next/server";
import { withResultHandler } from "@/lib/api/result-handler";
import { createFeature } from "@/lib/services/[feature]-service";

export const POST = withResultHandler(async (request: NextRequest) => {
  const body = await request.json();
  const context = getTenantContext(request);

  return createFeature(body, context);
});
```

### Unit Test

```typescript
import { describe, it, expect } from "vitest";
import { createFeature } from "@/lib/services/[feature]-service";
import { expectSuccess, expectFailure } from "../../utils/helpers";

describe("FeatureService", () => {
  const context = { tenantId: "test-tenant", userId: "test-user" };

  it("creates a feature with valid data", async () => {
    const result = await createFeature({ name: "Test Feature" }, context);

    expectSuccess(result);
    expect(result.value.tenantId).toBe("test-tenant");
  });

  it("returns validation failure for invalid data", async () => {
    const result = await createFeature({ name: "" }, context);

    expectFailure(result);
    expect(result.error.type).toBe("ValidationError");
  });
});
```

## Completion Checklist

- [ ] Result Pattern used for new business logic.
- [ ] Tenant isolation preserved.
- [ ] Unit tests cover success and failure branches.
- [ ] E2E coverage added for user-facing flows when relevant.
- [ ] `lint`, `typecheck`, `build`, and targeted tests run or blockers documented.
- [ ] `.agents/session/current_task.md` updated when this workflow is active.
