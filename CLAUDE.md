# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a multitenant SaaS platform for beauty salons built with a sophisticated autonomous development workflow system. The project uses a monorepo structure with Next.js for the frontend/backend and implements a Result Pattern for error handling.

## Core Architecture & Development Workflow

### Autonomous Development System

The project implements a Swarm Architecture & Memory Protocol that enables AI agents to work autonomously:

- **Memory System** (`.agents/memory/`) - Persistent context storage
- **Session Management** (`.agents/session/`) - Current task tracking
- **History Tracking** (`.agents/history/`) - Error logs and test cases
- **Skills Framework** (`.agents/skills/`) - Specialized agent capabilities
- **Protocols** (`.agents/protocols/`) - Standardized procedures

### Key Directives from AGENTS.md

1. **Result Pattern Mandatory**: All new code must use Result<T, E> pattern instead of try/catch
2. **Explicit Error Types**: All errors must be typed DomainError variants
3. **Composable Operations**: Chain Results with map, flatMap, and combinators
4. **Type-safe Validation**: Use Zod schemas with Result integration

### Required Imports for Result Pattern

```typescript
import { Result, Ok, Err, match } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import {
  validateWithZod,
  CommonSchemas,
} from "@sass-store/validation/src/zod-result";
```

## Essential Commands

### Development

```bash
npm run dev                    # Start development server (port 3001)
npm run build                  # Build the application
npm run lint                   # Run ESLint
npm run typecheck              # Run TypeScript type checking
```

### Testing

```bash
npm run test:unit              # Run unit tests
npm run test:integration       # Run integration tests
npm run test:security          # Run security tests
npm run test:e2e               # Run all E2E tests
npm run test:e2e:subset -- --grep "feature"  # Run specific E2E tests
npm run test:coverage          # Run tests with coverage report
npm run validate               # Run complete validation (lint + build + tests)
```

### Database

```bash
npm run db:generate            # Generate database migrations
npm run db:push                # Apply migrations to database
npm run db:seed                # Seed database with test data
npm run rls:apply              # Apply Row Level Security policies
npm run rls:test               # Test RLS policies
```

### Autonomous Agent Commands

```bash
npm run agent:build            # Lint + typecheck + build
npm run agent:test             # Run unit and E2E tests
npm run agent:e2e              # Build and run E2E tests
npm run agent:ship             # Complete validation pipeline
npm run swarm:start "feature"  # Start swarm orchestrator for a feature
```

### Security & Maintenance

```bash
npm run security:autofix       # Automatically fix security issues
npm run security:check-deps    # Check for vulnerable dependencies
npm run security:update-deps   # Update dependencies to fix vulnerabilities
```

## Project Structure

```
├── apps/
│   └── web/                   # Next.js application (UI + API routes)
├── packages/                  # Shared libraries and components
├── tests/                     # Test suites
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   └── e2e/                   # End-to-end tests
├── migrations/                # Database migrations
├── scripts/                   # Automation scripts
├── docs/                      # Documentation
├── .agents/                   # Autonomous agent system
│   ├── memory/                # Context and rules
│   ├── session/               # Current task tracking
│   ├── history/               # Error logs and test cases
│   ├── skills/                # Agent capabilities
│   └── protocols/             # Standardized procedures
└── tools/                     # Development tools
```

## Development Guidelines

### Code Quality Standards

- Strict TypeScript with noImplicitAny
- ESLint with Prettier formatting
- 2-space indentation
- Trailing commas enforced
- Component files use PascalCase
- Hooks start with `use`
- Constants use UPPER_SNAKE_CASE

### Testing Requirements

- Maintain >=80% coverage for critical paths
- Test both success and failure paths for Result patterns
- Use data builders instead of hardcoded test data
- Update `QA_LEADER_IMPLEMENTATION_SUMMARY.md` after significant changes

### Result Pattern Implementation

```typescript
// ✅ CORRECT: Result Pattern
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

// ❌ FORBIDDEN: Old try/catch
export async function GET(request: NextRequest) {
  try {
    const product = await getProduct(id);
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
```

## Autonomous Agent Workflow

### MANDATORY: Full-Site Validation & Auto-Correct-Deploy Pipeline

**This is NON-NEGOTIABLE for every agent, every task, every US, every fix.**  
No task is complete until this pipeline finishes with zero errors.

```
┌─────────────────────────────────────────────────────────────────────┐
│          PIPELINE OBLIGATORIO DE TODO AGENTE AUTÓNOMO               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. LEVANTAR → npm run dev (si el servidor no está activo)          │
│     Esperar health check en http://localhost:3001/api/health         │
│                                                                      │
│  2. VALIDAR SITIO COMPLETO como persona real con Playwright CLI      │
│     → Recorrer TODA la app: web pública + admin + todas las rutas   │
│     → No solo el feature trabajado: TODO el sitio                   │
│     → Modo headed --slow-mo 300 para inspección visual              │
│                                                                      │
│  3. CORREGIR AUTOMÁTICAMENTE cada error encontrado                  │
│     → No reportar y esperar: corregir de inmediato                  │
│     → Aplicar árbol de diagnóstico del protocolo e2e-validation.md  │
│                                                                      │
│  4. REINICIAR y RE-VALIDAR exhaustivamente tras cada corrección     │
│     → Volver al paso 2 hasta que el sitio completo pase sin errores │
│     → Máx 5 ciclos; si persiste → bloqueo documentado              │
│                                                                      │
│  5. CONFIRMAR en headless (gate CI)                                 │
│     → npm run test:e2e                                              │
│     → 0 tests fallidos, 0 skipped sin justificación                 │
│                                                                      │
│  6. APAGAR servicios limpiamente                                    │
│     → Detener el proceso dev server levantado por el agente         │
│                                                                      │
│  7. DEPLOY de todo lo corregido                                     │
│     → npm run build (debe ser exitoso)                              │
│     → git add + commit (Conventional Commits)                       │
│     → push a la rama activa                                         │
│     → Abrir / actualizar PR si aplica                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Cobertura mínima del paso 2 (sitio completo):**

| Área                | Rutas clave a validar                       |
| ------------------- | ------------------------------------------- |
| Landing / zo-system | `/`, `/t/zo-system/`                        |
| Admin global        | `/admin/tenants`, `/admin/social-planner`   |
| Tenant admin        | `/t/[tenant]/admin/` — al menos wondernails |
| Finance             | `/t/[tenant]/finance/`                      |
| Inventory           | `/t/[tenant]/inventory/`                    |
| Bookings            | `/t/[tenant]/book/`                         |
| Auth                | Login, registro, callback OAuth             |

Si una ruta muestra error, pantalla blanca, 4xx/5xx, o comportamiento roto → **corregir antes de continuar**.

### Required E2E Validation Process (feature-level)

After implementing features, always complete these 4 steps:

1. **Playwright CLI headed** - Agent runs visual validation

   ```bash
   npm run test:e2e:subset -- --headed --grep "feature-name"
   ```

2. **Fix & iterate** - Correct any visual or functional issues

3. **Create/update E2E tests** - Ensure test coverage in `tests/e2e/`

4. **Headless execution** - Validate all tests pass
   ```bash
   npm run test:e2e:subset -- --grep "feature-name"
   ```

### Agent Roles & Documentation

Each role has dedicated implementation summaries that must be updated after changes:

- **QA Leader**: `QA_LEADER_IMPLEMENTATION_SUMMARY.md`
- **Architect**: `ARCHITECT_IMPLEMENTATION_SUMMARY.md`
- **Dev Leader**: `DEV_LEADER_IMPLEMENTATION_SUMMARY.md`
- **Product Manager**: `PM_IMPLEMENTATION_SUMMARY.md`

## Security Practices

- Enforce tenant isolation with RLS filters
- Sanitize all rendered HTML
- Keep secrets out of git
- Run `npm run security:autofix` before releases
- Never store credentials in fixtures or docs

## Performance Guidelines

- Use combinators efficiently for Result chain operations
- Implement caching for expensive operations with `ResultCache`
- Use `asyncFlatMap()` for async operations
- Monitor performance with `withPerformanceTracking`

## Commit & PR Guidelines

- Follow Conventional Commits format
- PRs must pass `npm run build`, `npm run lint`, and targeted test suites
- Never push directly to `main` branch
- Result Pattern compliance is mandatory for all PRs
