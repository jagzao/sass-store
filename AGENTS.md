# Repository Guidelines

## Project Structure & Module Organization
Turbo workspaces split the monorepo into `apps/web` (Next.js App Router UI on port 3001) and `apps/api` (API surface on port 4000). Keep web widgets in `components/` and routes in `app/`. API handlers belong in `app/api/**`, shared services in `lib/`, and seeds in `scripts/`. Reusable schema, UI primitives, and config live in `packages/*`. Tests sit in `tests/{unit,integration,e2e}` with fixtures under `tests/utils`. Operational guides stay in `docs/`, automation in `commands/` and `tools/`, and database assets under `migrations/` with `drizzle.config.ts`.

## Build, Test, and Development Commands
Run commands from the repo root for Turbo caching.
- `npm run dev` (optionally `-- --filter=@sass-store/web`) to start workspaces.
- `npm run build`, `npm run lint`, `npm run typecheck` as CI gates.
- `npm run test`, `npm run test:unit`, `npm run test:integration`, `npm run test:e2e` for Vitest and Playwright.
- `npm run test:e2e:subset -- --grep "booking"` to target a flow.
- `npm run db:generate`, `npm run db:push`, `npm run db:seed` to manage Drizzle via `apps/api`.

## Coding Style & Naming Conventions
Use TypeScript strict mode and Prettier (2-space indent, trailing commas); format larger diffs with `npx prettier --write`. Components use PascalCase filenames, hooks start with `use` in camelCase, utilities stay camelCase, and constants use UPPER_SNAKE_CASE. Keep server-only logic in `app/(...)/route.ts` segments, promote shared code into `packages/*`, avoid `any`, prefer `unknown` with guards, and export types separately for treeshaking.

## Testing Guidelines
Store Vitest specs in `tests/{unit,integration}` as `*.spec.ts` and reuse `tests/utils` fixtures. Playwright runs against port 3001 via `playwright.config.ts` and saves artifacts to `test-results/`; attach relevant files to PRs. Maintain >=80% coverage for business logic and update `TESTING_IMPLEMENTATION_SUMMARY.md` when budgets change.

## Commit & Pull Request Guidelines
Write Conventional Commits (e.g., `feat(auth): add OAuth2 flow`) and include the primary test command in each message. PRs must follow `.github/pull_request_template.md`: state type/severity/scope, link the executed plan, upload bundles from `agents/bundles/{bundle_id}`, highlight risks, and add UI screenshots when applicable. Never push to main directly; open PRs with passing `npm run build`, `npm run lint`, and focused tests.

## Security & Agent Workflow Tips
Keep secrets out of the repo; copy `.env.example` to `.env.local` locally. Validate inputs with Zod, enforce tenant isolation through RLS filters, and sanitize rendered HTML. Run `npm run security:autofix` ahead of releases. Launch swarm automation with `npm run swarm:start "<feature name>"` so PM -> Architect -> QA -> Security agents deliver artifacts to `docs/prd/` and `agents/bundles/`.
