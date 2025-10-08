# Repository Guidelines

## Project Structure & Module Organization

Turbo workspaces drive this monorepo:

- pps/web � Next.js App Router UI on :3001; UI widgets in components/, routes under pp/.
- pps/api � Next.js API surface on :4000; pp/api/\*\* hosts handlers, lib/ holds shared services, scripts/ stores seeds.
- packages/\* � shared config, Drizzle schema, and UI primitives; depend on these instead of cross-app imports.
-     ests � Vitest suites in unit and integration, Playwright specs in e2e, helpers under utils.
- docs/, commands/, ools/ � operational playbooks and automation used by agents; review them before creating new workflows.

## Build, Test, and Development Commands

Run commands from the repo root to reuse Turbo caching:

- pm run dev starts all dev servers; filter with
  pm run dev -- --filter=@sass-store/web.
- pm run build,
  pm run lint,
  pm run typecheck gate CI for every workspace.
- pm run test, along with est:unit, est:integration, est:e2e, cover the full suite. Use
  pm run test:e2e:subset -- --grep "booking" for targeted Playwright runs.
- Database maintenance proxies to pps/api:
  pm run db:generate, db:push, db:seed.

## Coding Style & Naming Conventions

- TypeScript + Prettier defaults (2-space indent, trailing commas) backed by Next ESLint config; run
  px prettier --write before submitting broad diffs.
- React components/files use PascalCase, hooks/utilities use camelCase, and Tailwind utilities stay inline.
- Keep server-only logic in pp/(...)/route.ts segments and move reusable code into packages/ to avoid duplicated logic.

## Testing Guidelines

- Vitest specs live under ests/{unit,integration} with \*.spec.ts naming; reuse helpers from ests/utils for filesystem and tenant fixtures.
- Playwright config in playwright.config.ts binds to :3001 and stores traces, screenshots, and HTML reports under est-results/; upload relevant artifacts with PRs.
- Update TESTING_IMPLEMENTATION_SUMMARY.md whenever coverage expectations change or new budgets are introduced.

## Commit & Pull Request Guidelines

- With no history yet, follow Conventional Commits (eat(web): add booking badge) so automated triage can infer scope and severity.
- Keep commits focused and document the main test command in the body.
- PRs must respect .github/pull_request_template.md: declare type/severity/scope, link the executed plan, provide bundle artifacts from gents/bundles/{bundle_id}, summarize risks, and attach screenshots for UI work.

## Environment & Configuration

- Copy each .env.example to .env.local, never commit secrets, and run on Node =18 with npm 9.6.7 per package.json.
- If asset builds fail on Windows, reinstall native deps with npm rebuild sharp before retrying npm run build.

## Code Quality Standards

### TypeScript & Type Safety

- **Strict Mode:** Always use TypeScript strict mode (`strict: true` in tsconfig.json)
- **No Any Types:** Avoid `any` types; use `unknown` with type guards or specific types
- **Proper Error Handling:** All async functions must have try-catch blocks or proper error boundaries
- **Type Exports:** Export types/interfaces separately for better tree-shaking

### Code Organization

- **Function Complexity:** Max cyclomatic complexity of 10 per function
- **File Length:** Max 300 lines per file; split into smaller modules if exceeded
- **Component Structure:** Follow container/presenter pattern for complex components
- **Naming Conventions:**
  - Components: PascalCase (e.g., `UserProfile.tsx`)
  - Hooks: camelCase starting with "use" (e.g., `useAuth.ts`)
  - Utilities: camelCase (e.g., `formatDate.ts`)
  - Constants: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)

### Documentation Requirements

- **JSDoc Comments:** All exported functions/classes must have JSDoc
- **Complex Logic:** Inline comments for business logic complexity
- **API Documentation:** GraphQL schemas and REST endpoints must be documented
- **README Updates:** Update relevant README when adding new features

### Performance Standards

- **Bundle Size:** Individual chunks max 200KB gzipped
- **React Optimization:** Use `memo`, `useMemo`, `useCallback` appropriately
- **Image Optimization:** All images must use Next.js Image component with proper sizing
- **Lazy Loading:** Code-split routes and heavy components

### Security Standards

- **No Hardcoded Secrets:** All credentials in environment variables
- **Input Validation:** Validate all user inputs with Zod schemas
- **SQL Injection Prevention:** Use ORM/parameterized queries only
- **XSS Prevention:** Sanitize HTML with DOMPurify before rendering
- **CSRF Protection:** Implement CSRF tokens for state-changing operations
- **RLS Policies:** All database tables must have Row Level Security enabled
- **Authentication:** All API routes must validate session/token
- **Tenant Isolation:** All queries must filter by tenantId in multi-tenant context

### Testing Standards

- **Unit Tests:** Min 80% coverage for utilities and business logic
- **Integration Tests:** All API endpoints must have integration tests
- **E2E Tests:** Critical user flows must have Playwright tests
- **Test Naming:** Use descriptive names: `should [expected behavior] when [condition]`
- **Mocking:** Use MSW for API mocking in tests
- **Test Data:** Use factories/fixtures, never hardcode test data

### Git & Version Control

- **Conventional Commits:** Follow format: `type(scope): description`
  - Types: feat, fix, docs, style, refactor, test, chore
  - Example: `feat(auth): add OAuth2 login flow`
- **Branch Naming:** `feature/`, `fix/`, `hotfix/`, `refactor/` prefixes
- **PR Reviews:** Minimum 1 approval required, all CI checks must pass
- **No Direct Commits:** to main/master; use PRs for all changes

### Swarm Agent Guidelines

#### PM (Product Manager) Agent 📋

**Responsabilidad:** Validación de requisitos de negocio antes de desarrollo

**Funciones:**

- **Genera user stories** automáticamente basadas en el nombre del feature
- **Define requirements** funcionales, no-funcionales y técnicos
- **Valida business rules** y asegura alineación con objetivos del negocio
- **Estima esfuerzo** en story points y horas (1 point = 2-3 hours)
- **Identifica riesgos** y dependencias del feature
- **Crea PRD** (Product Requirements Document) guardado en `docs/prd/`

**Output:**

- User stories con acceptance criteria
- Functional, non-functional, technical requirements
- Business validation (issues + recommendations)
- Dependencies list
- Effort estimate (points, hours, complexity, risks)
- Complete PRD in markdown format

**Ejemplo de User Story generada:**

```
US-001: Agregar producto al carrito
As a Cliente
I want agregar productos al carrito
So that pueda comprar múltiples items en una sola transacción

Acceptance Criteria:
- El botón "Agregar al carrito" es visible
- Se puede seleccionar cantidad
- El producto se agrega al estado del carrito
- Se muestra confirmación visual

Priority: 1 | Estimate: 3 pts
```

#### QA Agent 🧪

- Automatically creates tests for new features
- Runs test suites and reports failures
- Updates existing tests when features change
- Validates test coverage meets standards (>80%)
- Generates test reports with pass/fail metrics
- Creates E2E, integration, or unit tests based on feature type

#### Code Quality Agent 📋

- Validates adherence to code standards (see above)
- Runs ESLint, TypeScript compiler, and custom checks
- Auto-fixes: console.logs, formatting issues
- Reports: complexity, naming violations, missing docs
- Checks max file length (300 lines), function complexity (max 10)
- Blocks merge if critical quality issues found

#### Security Agent 🔒 (Updated 2025)

**UPDATED:** Now includes OWASP Top 10:2025 + Next.js CVE-2025-29927 detection

**Capabilities:**

- **OWASP Top 10:2025 Coverage:**
  - A01: Broken Access Control (RLS, Server Actions auth)
  - A02: Cryptographic Failures (secrets exposure, weak crypto)
  - A03: Injection (SQL, XSS, Code Injection)
  - A04: Insecure Design (missing validation, poor patterns)
  - A05: Security Misconfiguration (headers, CORS, CSP)
  - A06: Vulnerable Components (npm audit, outdated deps)
  - A07: Auth Failures (session management, JWT)
  - A08: Data Integrity Failures (unsigned data, missing checksums)
  - A09: Logging Failures (sensitive data in logs)
  - A10: SSRF (Server-Side Request Forgery)
  - **A11: AI/LLM Security** (NEW - prompt injection, AI API keys)

- **Next.js 2025 Security:**
  - CVE-2025-29927: Middleware auth bypass detection
  - Server Actions session verification (verifySession required)
  - Data Access Layer (DAL) pattern validation
  - NEXT*PUBLIC* secret exposure detection
  - httpOnly cookies enforcement

- **Multi-Tenant Security:**
  - Row Level Security (RLS) validation
  - Tenant isolation in all queries
  - tenantId filter enforcement

- **SAST/DAST/SCA:**
  - 50+ security patterns
  - Automated code analysis
  - Dependency scanning
  - Secret detection
  - 8-phase comprehensive scan

- **Auto-Remediation:**
  - 4 auto-fixable issue types
  - Safe code transformations
  - Detailed change tracking

**Blocks Deployment:** YES if critical issues found
**Documentation:** docs/SECURITY_ANALYSIS_2025.md
**Auto-fix:** npm run security:autofix

#### Integration Workflow (Updated)

1. **PM Agent** → Validates business requirements, generates user stories and PRD
2. **Architect** → Plans feature architecture based on PRD
3. **Developer** → Implements the feature
4. **QA Agent** → Creates/updates tests, validates functionality
5. **Code Quality Agent** → Validates code standards, auto-fixes issues
6. **Security Agent** → Scans for vulnerabilities, validates security
7. **Tester** → Final validation and approval

All agents report to swarm session with structured output for tracking.

**How to use:**

```bash
npm run swarm:start "Feature name or description"
```

The PM Agent will analyze the feature name and generate appropriate requirements automatically.
