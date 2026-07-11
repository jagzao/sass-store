# Repository Guidelines — Sass Store

Hard-earned context for working in this repo. Generic advice is omitted.

## Project structure

- `apps/web` is the only production Next.js App Router app (Next 16 / React 19 / Tailwind 3 in app).
- `packages/{cache,config,core,database,ui,validation,wa-platform}` are internal workspaces.
- App routes: `apps/web/app/**` (UI in `app/**`, API handlers in `app/api/**`).
- Shared widgets/helpers: `apps/web/components/**` and `apps/web/lib/**`.
- Tests: `tests/{unit,integration,e2e,security}`.
- Migrations live in `packages/database/migrations`.
- Story artifacts: `docs/stories/` and `.agents/sprint/{STRY-XXX-slug}/`.

## First-time setup

1. Copy `.env.example` to `.env.local` and fill `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.
2. `npm install` (package manager pinned to `npm@9.8.1`).
3. `npm run db:push` then `npm run db:seed` when schema changes land.

## Exact commands

Run everything from the repo root unless noted.

| What              | Command                                                                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Dev server        | `npm run dev` — starts `apps/web` on **port 3003**                                                                                             |
| Build             | `npm run build` — turbo filters `@sass-store/web`                                                                                              |
| Lint              | `npm run lint` — turbo filters `@sass-store/web`                                                                                               |
| Typecheck         | `npm run typecheck` — turbo filters `@sass-store/web` (Next 16 typecheck is delegated to `next build`; `apps/web` also has `typecheck:strict`) |
| Prettier          | `npx prettier --write "apps/**/*.{ts,tsx}" "packages/**/*.{ts,tsx}"`                                                                           |
| Unit tests        | `npm run test:unit` — Vitest, `*.spec.ts`, excludes `*.test.ts` legacy                                                                         |
| Integration tests | `npm run test:integration`                                                                                                                     |
| E2E subset        | `npm run test:e2e:subset -- --grep "pattern"`                                                                                                  |
| E2E full          | `npm run test:e2e`                                                                                                                             |
| Coverage          | `npm run test:coverage`                                                                                                                        |
| DB generate       | `npm run db:generate`                                                                                                                          |
| DB push           | `npm run db:push`                                                                                                                              |
| DB seed           | `npm run db:seed`                                                                                                                              |
| Security autofix  | `npm run security:autofix`                                                                                                                     |
| Pre-PR gate       | `npm run build && npm run lint && npm run typecheck`                                                                                           |

## Monorepo boundaries

- `apps/web` depends on `@sass-store/{config,core,database,ui,validation}`.
- Edit shared packages first, then propagate to `apps/web`.
- `turbo.json` builds from the root; outputs go to `.next/**` and `dist/**`.

## Ports & environments

- Dev: **3003** (`apps/web/package.json`).
- E2E: **3002** (started by `scripts/start-e2e-server.js` via Playwright `webServer`).
- E2E env vars are hardcoded in `playwright.config.ts` (`AUTH_SECRET`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, etc.).
- To reuse a running dev server: `BASE_URL=http://localhost:3003 E2E_REUSE_SERVER=1 npx playwright test ...`
- `vitest.config.ts` loads `.env` via `dotenv.config()` and aliases `@` to `apps/web` and `@sass-store/*` to `packages/*`.

## Testing quirks

- Playwright runs **serially** (`fullyParallel: false`, `workers: 1`) to avoid starving the dev server.
- Default base URL is `http://127.0.0.1:3002`.
- E2E spec files: `tests/e2e/**/*.spec.ts`.
- Unit/integration spec files: `tests/{unit,integration}/**/*.spec.ts`; legacy `*.test.ts` are excluded.
- Standard test creds: `jagzao@gmail.com` / `admin`.
- Active tenants in E2E: `wondernails`, `centro-tenistico`, `manada-juma`, `zo-system`.
- `npm run test:e2e:subset` delegates to `scripts/run-e2e-subset.js`.

## Style & conventions

- TypeScript strict, 2-space indentation, trailing commas, Prettier enforced.
- Components: PascalCase filenames. Hooks: `use*` prefix. Helpers: camelCase. Constants: `UPPER_SNAKE_CASE`.
- Server-only logic stays in `route.ts` files; avoid `any`; prefer explicit types.

## Result Pattern (mandatory for new code)

- **No `try/catch` in business logic.** Use `Result<T, DomainError>`.
- Required imports:
  ```typescript
  import { Result, Ok, Err, match } from "@sass-store/core/src/result";
  import {
    DomainError,
    ErrorFactories,
  } from "@sass-store/core/src/errors/types";
  import {
    validateWithZod,
    CommonSchemas,
  } from "@sass-store/validation/src/zod-result";
  ```
- Service functions return `Promise<Result<T, DomainError>>` or `Result<T, DomainError>`.
- API routes use `withResultHandler()`.
- Validation uses `validateWithZod()`.
- Chain with `pipe()`, `map()`, `flatMap()`.

## Post-implementation validation pipeline

After any code change, run in order:

1. `npx prettier --write` on modified files.
2. `npm run lint`
3. `npm run typecheck`
4. `npm run build`
5. `npm run test:unit` (or subset)
6. E2E: headed first, then headless (`npm run test:e2e:subset -- --headed --grep "feature"`, then without `--headed`).
7. `npm run security:autofix` if applicable.

If any step fails, fix and restart from that step. Max 5 attempts per failing step before declaring a blocker.

## User Story workflow (high-level)

- Stories live in `docs/stories/active/STRY-XXX-*.md`.
- Each active story has `.agents/sprint/{STRY-XXX-slug}/{plan.md,implementacion.md,testing-usuario.md}`.
- Standard test creds for stories: `jagzao@gmail.com` / `admin`.
- DoD before marking `done`: implementation complete → agent QA → fixes → unit tests green → agent barrier per `testing-usuario.md` on every listed tenant → Playwright headless green → explicit owner approval → move to completed, commit, push.
- Never mark a story `done` or push without explicit owner approval.

## Security / ops notes

- RLS and tenant isolation are required; use `apply-rls.ts` / `test-rls.ts` when changing policies.
- Keep secrets out of git. Use `.env.local`, not `.env`.
- `npm run security:autofix` runs a TypeScript autofix script; it is not a full audit.
- Run `npm run db:generate` and `npm run db:push` after any schema change.

## Adding a new tenant

See `docs/AGREGAR_TENANT.md` for the complete checklist (DB insert, user role, PWA icons via `scripts/generate-pwa-icons.js`, seed data, verification).
