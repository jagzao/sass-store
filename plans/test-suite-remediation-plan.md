# Test Suite Remediation Plan

## Executive Summary

This document provides a comprehensive remediation plan to fix the failing test suite. The current state shows **178 failed / 190 passed** unit tests, with failures across multiple categories:

1. Database initialization issues (major recurring error)
2. Result Pattern API mismatches
3. Faker API usage errors
4. Cleanup hook failures
5. Tenant context test mismatches
6. E2E command issues on Windows

---

## Quick Wins: Stabilize Tests First

### Phase 0: Critical Infrastructure Fixes (Immediate Priority)

**Objective**: Fix the most common errors preventing tests from running properly.

#### 0.1 Fix Database Initialization

**Root Cause**: [`tests/setup/test-database.ts`](tests/setup/test-database.ts:16) throws "Test database not initialized" error when `getTestDb()` is called before `setupTestDatabase()` completes.

**Suspected Issues**:
- Global setup in [`tests/setup/vitest.global-setup.ts`](tests/setup/vitest.global-setup.ts:3) may not complete before tests start
- `TEST_DATABASE_URL` environment variable may not be set
- Async initialization race condition

**Files to Modify**:
- [`tests/setup/test-database.ts`](tests/setup/test-database.ts:1)
- [`tests/setup/vitest.global-setup.ts`](tests/setup/vitest.global-setup.ts:1)
- [`vitest.config.ts`](vitest.config.ts:1)

**Acceptance Criteria**:
- All tests requiring database access can initialize successfully
- No "Test database not initialized" errors
- Tests run with or without `TEST_DATABASE_URL` (graceful degradation)

**Risk Notes**:
- Low risk - only affects test infrastructure
- May require adding `.env.test` file

#### 0.2 Fix Faker API Usage

**Root Cause**: [`tests/builders/TenantBuilder.ts`](tests/builders/TenantBuilder.ts:192) calls `testFaker.company.name()` but `testFaker.company` is a function that returns an object.

**Files to Modify**:
- [`tests/builders/TenantBuilder.ts`](tests/builders/TenantBuilder.ts:192) - Line 192, 193, 208, 209

**Current Code**:
```typescript
.withName(testFaker.company.name())
.withDescription(testFaker.company.description())
```

**Required Fix**:
```typescript
.withName(testFaker.company().name())
.withDescription(testFaker.company().description())
```

**Acceptance Criteria**:
- TenantBuilder tests pass without Faker errors
- All `testFaker` calls use correct API

**Risk Notes**:
- Very low risk - simple API correction
- No production impact

#### 0.3 Fix Mock Database Cleanup

**Root Cause**: Cleanup hooks in [`tests/unit/services/InventoryService.spec.ts`](tests/unit/services/InventoryService.spec.ts:219) and [`tests/unit/services/CartService.spec.ts`](tests/unit/services/CartService.spec.ts:176) call `clear()` on undefined or improperly initialized mocks.

**Files to Modify**:
- [`tests/unit/services/InventoryService.spec.ts`](tests/unit/services/InventoryService.spec.ts:213-220)
- [`tests/unit/services/CartService.spec.ts`](tests/unit/services/CartService.spec.ts:169-177)

**Acceptance Criteria**:
- `afterEach` hooks execute without errors
- Mock database properly clears between tests
- Test isolation maintained

**Risk Notes**:
- Low risk - only affects test isolation
- May reveal hidden test dependency issues

---

## Phase 1: Result Pattern Test Alignment

**Objective**: Align test expectations with actual Result Pattern implementation.

### 1.1 Update Result Pattern Tests

**Root Cause**: [`tests/unit/result-pattern.spec.ts`](tests/unit/result-pattern.spec.ts:1) expects Result objects to have methods like `match()`, `map()`, `getOrElse()`, `mapError()` directly, but the implementation in [`packages/core/src/result/index.ts`](packages/core/src/result/index.ts:1) provides these as standalone functions.

**Files to Modify**:
- [`tests/unit/result-pattern.spec.ts`](tests/unit/result-pattern.spec.ts:1) - Entire file
- [`packages/core/src/result/index.ts`](packages/core/src/result/index.ts:1) - Optional: Add instance methods if desired

**Key Mismatches**:

| Test Expectation | Actual Implementation |
|-----------------|---------------------|
| `result.match({ok, err})` | `match(result, {ok, err})` |
| `result.map(fn)` | `map(result, fn)` |
| `result.getOrElse(fallback)` | `getOrElse(result, fallback)` |
| `result.mapError(fn)` | `mapError(result, fn)` |
| `result.data` / `result.error` | Correct (direct access works) |

**Acceptance Criteria**:
- All Result Pattern tests pass
- Tests use correct API (standalone functions or pipe)
- Test coverage maintained

**Risk Notes**:
- Medium risk - affects core testing patterns
- May require updating multiple test files
- Consider adding instance methods to Result type for better DX

**Estimated Effort**: 2-3 hours

---

## Phase 2: Tenant Context Test Fixes

**Objective**: Fix tenant context test mismatches and expected behavior.

### 2.1 Review and Fix Tenant Context Tests

**Root Cause**: [`tests/unit/tenant-context.test.ts`](tests/unit/tenant-context.test.ts:1) has mismatches between expected and actual behavior of the `withTenantContext` middleware.

**Files to Modify**:
- [`tests/unit/tenant-context.test.ts`](tests/unit/tenant-context.test.ts:1)
- [`apps/web/lib/db/tenant-context.ts`](apps/web/lib/db/tenant-context.ts) - May need review

**Suspected Issues**:
- Mock setup doesn't match actual middleware behavior
- Response status codes may be incorrect
- Error handling expectations may be wrong

**Acceptance Criteria**:
- All tenant context tests pass
- Tests accurately reflect middleware behavior
- Mock setup aligns with actual implementation

**Risk Notes**:
- Medium risk - may reveal actual middleware bugs
- Could require middleware fixes instead of just test fixes

**Estimated Effort**: 1-2 hours

---

## Phase 3: E2E Test Infrastructure

**Objective**: Fix E2E test command issues on Windows and ensure proper test discovery.

### 3.1 Fix Windows Command Parsing

**Root Cause**: Windows cmd.exe interprets special characters (`|`, `(`, `)`) in regex patterns as shell operators rather than passing them to Playwright.

**Problem Commands**:
```cmd
npm run test:e2e -- --grep "(quote|cotiz|cotización)"
```

**What Happens**:
- cmd.exe parses `(quote|cotiz|cotización)` incorrectly
- `cotiz` is treated as a separate command
- Regex pattern is corrupted

**Solution 1: Escape Special Characters (cmd.exe)**
```cmd
npm run test:e2e -- --grep "(quote^|cotiz^|cotización)"
```

**Solution 2: Use PowerShell**
```powershell
npm run test:e2e -- --grep "(quote|cotiz|cotización)"
```

**Solution 3: Use Double Quotes**
```cmd
npm run test:e2e -- --grep "\"(quote|cotiz|cotización)\""
```

**Solution 4: Create Wrapper Script**
Create `run-e2e-tests.cmd`:
```cmd
@echo off
npx playwright test --grep "%~1"
```

Usage:
```cmd
run-e2e-tests.cmd "(quote|cotiz|cotización)"
```

**Acceptance Criteria**:
- E2E tests run correctly on Windows cmd.exe
- Regex patterns are properly passed to Playwright
- Cross-platform compatibility maintained

**Risk Notes**:
- Low risk - only affects command execution
- No code changes required

### 3.2 Verify E2E Test Structure

**Finding**: No quote/cotización E2E tests currently exist in [`tests/e2e/`](tests/e2e/).

**Action Required**:
- Create quote-related E2E tests if needed
- Or document that quote functionality is only tested via unit/integration tests

**Acceptance Criteria**:
- Clear documentation of test coverage
- E2E tests exist for critical user flows
- Test naming follows conventions

**Risk Notes**:
- Low risk - documentation only
- May reveal missing test coverage

---

## Phase 4: Comprehensive Test Suite Validation

**Objective**: Ensure all tests pass and maintain stability.

### 4.1 Run Full Test Suite and Fix Remaining Issues

**Files to Review**:
- All files in [`tests/unit/`](tests/unit/)
- All files in [`tests/integration/`](tests/integration/)
- All files in [`tests/e2e/`](tests/e2e/)

**Acceptance Criteria**:
- All unit tests pass (target: 190/190)
- All integration tests pass
- All E2E tests pass
- Test coverage >= 80%
- No flaky tests

**Risk Notes**:
- Medium risk - may uncover additional issues
- Time-consuming but necessary

**Estimated Effort**: 4-6 hours

---

## Windows-Friendly Test Commands

### Unit Test Commands

**Run all unit tests:**
```cmd
npm run test:unit
```

**Run specific test file:**
```cmd
npx vitest run tests/unit/result-pattern.spec.ts
```

**Run tests matching pattern:**
```cmd
npx vitest run tests/unit --grep "Result Pattern"
```

**Run tests in watch mode:**
```cmd
npm run test:watch
```

### Integration Test Commands

**Run all integration tests:**
```cmd
npm run test:integration
```

**Run specific integration test:**
```cmd
npx vitest run tests/integration/database-integration.spec.ts
```

### E2E Test Commands

**Run all E2E tests:**
```cmd
npm run test:e2e
```

**Run E2E tests with grep (PowerShell):**
```powershell
npm run test:e2e -- --grep "(quote|cotiz|cotización)"
```

**Run E2E tests with grep (cmd.exe - escaped):**
```cmd
npm run test:e2e -- --grep "quote"
```

**Run specific E2E test file:**
```cmd
npx playwright test tests/e2e/auth/login-zosystem.spec.ts
```

**Run E2E tests in UI mode:**
```cmd
npm run test:e2e:ui
```

**Run E2E tests with debugging:**
```cmd
npm run test:e2e:debug
```

### Fallback Commands

**When grep finds no tests:**
```cmd
REM List all available E2E tests
npx playwright test --list

REM Run all tests in a specific directory
npx playwright test tests/e2e/auth/

REM Run a single test file
npx playwright test tests/e2e/example.spec.ts
```

**When tests fail to run:**
```cmd
REM Check Playwright installation
npx playwright install

REM Check browser installation
npx playwright install chromium

REM Verify configuration
npx playwright test --config=playwright.config.ts --dry-run
```

---

## Root Cause Analysis Summary

### 1. Database Initialization (Primary Issue)

**Symptoms**: "Test database not initialized. Call setupTestDatabase() first."

**Root Causes**:
1. Global setup async timing issue
2. Missing `TEST_DATABASE_URL` environment variable
3. Tests calling `getTestDb()` before setup completes

**Impact**: Affects all database-dependent tests (~100+ tests)

### 2. Result Pattern API Mismatch

**Symptoms**: Tests fail with "result.match is not a function" or similar

**Root Causes**:
1. Tests expect instance methods on Result objects
2. Implementation provides standalone functions
3. Inconsistent API usage across codebase

**Impact**: Affects Result Pattern tests and any tests using Result pattern

### 3. Faker API Usage Error

**Symptoms**: "testFaker.company.name is not a function"

**Root Causes**:
1. Incorrect API usage in TenantBuilder
2. `testFaker.company` is a function, not an object

**Impact**: Affects all tests using TenantBuilder

### 4. Cleanup Hook Failures

**Symptoms**: "Cannot read property 'clear' of undefined"

**Root Causes**:
1. Mock database not properly initialized in beforeEach
2. Cleanup called on undefined context

**Impact**: Affects tests in InventoryService and CartService

### 5. E2E Command Issues (Windows)

**Symptoms**: Commands fail or don't find tests

**Root Causes**:
1. Windows cmd.exe interprets special characters
2. Regex patterns not properly escaped
3. No quote E2E tests exist

**Impact**: Blocks E2E test execution on Windows

---

## Risk Assessment by Phase

| Phase | Risk Level | Impact | Mitigation |
|-------|-----------|--------|------------|
| Phase 0: Quick Wins | Low | High | Simple fixes, well-understood issues |
| Phase 1: Result Pattern | Medium | Medium | May require API design decisions |
| Phase 2: Tenant Context | Medium | Low | May reveal middleware bugs |
| Phase 3: E2E Infrastructure | Low | Medium | Documentation and command fixes |
| Phase 4: Validation | Medium | High | Time-consuming but necessary |

---

## Estimated Effort Summary

| Phase | Estimated Time | Dependencies |
|-------|---------------|--------------|
| Phase 0: Quick Wins | 2-3 hours | None |
| Phase 1: Result Pattern | 2-3 hours | Phase 0 |
| Phase 2: Tenant Context | 1-2 hours | Phase 0 |
| Phase 3: E2E Infrastructure | 1-2 hours | None |
| Phase 4: Validation | 4-6 hours | Phases 0-3 |
| **Total** | **10-16 hours** | |

---

## Success Metrics

### Phase 0 Success Criteria
- [ ] No "Test database not initialized" errors
- [ ] All Faker API calls work correctly
- [ ] Cleanup hooks execute without errors
- [ ] At least 50% reduction in test failures

### Phase 1 Success Criteria
- [ ] All Result Pattern tests pass
- [ ] Consistent API usage across codebase
- [ ] Test documentation updated

### Phase 2 Success Criteria
- [ ] All tenant context tests pass
- [ ] Tests accurately reflect middleware behavior

### Phase 3 Success Criteria
- [ ] E2E tests run on Windows without errors
- [ ] Clear documentation of test coverage
- [ ] Cross-platform command compatibility

### Phase 4 Success Criteria
- [ ] All 190 unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Test coverage >= 80%
- [ ] No flaky tests

---

## Next Steps

1. **Immediate**: Execute Phase 0 fixes to stabilize the test suite
2. **Short-term**: Complete Phases 1-3 to align tests with implementation
3. **Medium-term**: Execute Phase 4 validation
4. **Long-term**: Establish CI/CD guardrails to prevent regression

---

## Appendix: Test Configuration Reference

### Vitest Configuration
- Config file: [`vitest.config.ts`](vitest.config.ts:1)
- Global setup: [`tests/setup/vitest.global-setup.ts`](tests/setup/vitest.global-setup.ts:1)
- Test setup: [`tests/setup/vitest.setup.ts`](tests/setup/vitest.setup.ts:1)

### Playwright Configuration
- Config file: [`playwright.config.ts`](playwright.config.ts:1)
- Test directory: [`tests/e2e/`](tests/e2e/)
- Base URL: `http://localhost:3001`

### Test Utilities
- Database setup: [`tests/setup/test-database.ts`](tests/setup/test-database.ts:1)
- Test context: [`tests/setup/TestContext.ts`](tests/setup/TestContext.ts:1)
- Mock database: [`tests/mocks/MockDatabase.ts`](tests/mocks/MockDatabase.ts:1)
- Test utilities: [`tests/setup/TestUtilities.ts`](tests/setup/TestUtilities.ts:1)

### Result Pattern Implementation
- Core: [`packages/core/src/result/index.ts`](packages/core/src/result/index.ts:1)
- Combinators: [`packages/core/src/result/combinators.ts`](packages/core/src/result/combinators.ts:1)
- Error types: [`packages/core/src/errors/types.ts`](packages/core/src/errors/types.ts:1)
