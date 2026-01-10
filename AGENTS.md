# Repository Guidelines

## Project Structure & Module Organization

Turbo workspaces split the repo into `apps/web` (Next.js App Router on port 3001) and `apps/api` (API on port 4000). Keep widgets in `apps/web/components/`, routes in `apps/web/app/`, API handlers inside `apps/api/app/api/**`, and shared services under `apps/api/lib/`. Reusable schema, UI primitives, and configs live in `packages/*`. Tests sit under `tests/{unit,integration,e2e}` with fixtures in `tests/utils`. Database, automation, and docs assets belong to `migrations/`, `commands/`, `tools/`, and `docs/`.

## Build, Test, and Development Commands

Run everything from the repo root to leverage Turbo caching. `npm run dev -- --filter=@sass-store/web` starts only the web UI; drop the filter to boot all workspaces. `npm run build`, `npm run lint`, and `npm run typecheck` are the CI gates. Use `npm run test`, or scope to `npm run test:unit`, `npm run test:integration`, and `npm run test:e2e`; target a flow with `npm run test:e2e:subset -- --grep "booking"`. Database work flows through `npm run db:generate`, `npm run db:push`, and `npm run db:seed` inside `apps/api`.

## Coding Style & Naming Conventions

TypeScript runs in strict mode with 2-space indentation and trailing commas enforced by Prettier (`npx prettier --write`). Components use PascalCase filenames, hooks start with `use` in camelCase, utilities stay camelCase, and constants use UPPER_SNAKE_CASE. Keep server-only logic in `app/(...)/route.ts` segments, avoid `any`, prefer `unknown` with guards, and export types separately for treeshaking.

## Testing Guidelines

Vitest specs belong in `tests/{unit,integration}` as `*.spec.ts`. Playwright points to port 3001 via `playwright.config.ts` and stores artifacts in `test-results/`. Maintain >=80% coverage for business logic and update `TESTING_IMPLEMENTATION_SUMMARY.md` whenever the plan changes.

## Commit & Pull Request Guidelines

Follow Conventional Commits (example: `feat(auth): add OAuth2 flow`) and document the primary test command in each message. PRs must follow `.github/pull_request_template.md`: state type, severity, and scope, link the executed plan, attach bundles from `agents/bundles/{bundle_id}`, summarize risks, and include UI screenshots when applicable. Never push directly to `main`; open PRs only after `npm run build`, `npm run lint`, and focused tests pass.

## Security & Agent Workflow Tips

Keep secrets out of the repo and create `.env.local` from `.env.example`. Validate inputs with Zod, enforce tenant isolation using RLS filters, and sanitize rendered HTML. Run `npm run security:autofix` before releases. Launch swarm automation with `npm run swarm:start "<feature name>"` so PM -> Architect -> QA -> Security agents deliver artifacts to `docs/prd/` and `agents/bundles/`.
