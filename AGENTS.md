# Repository Guidelines

## Project Structure & Module Organization

- Use the Turbo workspace layout: `apps/web` for the Next.js App Router UI (port 3001) and `apps/api` for the HTTP API (port 4000).
- Keep routes under `apps/web/app/**`, shared widgets inside `apps/web/components/**`, API handlers in `apps/api/app/api/**`, and domain services under `apps/api/lib/**`.
- Reusable schema, UI primitives, and configs belong inside `packages/*`; update them first, then propagate changes into individual apps.
- Tests live in `tests/{unit,integration,e2e}` with fixtures at `tests/utils`; migrations, automation, and docs stay in `migrations/`, `commands/`, `tools/`, and `docs/`.

## Build, Test, and Development Commands

- `npm run dev -- --filter=@sass-store/web` boots only the web UI; drop the filter to start all workspaces.
- `npm run build`, `npm run lint`, and `npm run typecheck` are mandatory before any PR.
- Test with `npm run test[:unit|:integration|:e2e]`; narrow Playwright via `npm run test:e2e:subset -- --grep "booking"`.
- Run `npm run db:generate`, `npm run db:push`, and `npm run db:seed` from `apps/api` whenever schema changes land.

## Coding Style & Naming Conventions

- TypeScript is strict with 2-space indentation, trailing commas, and formatting enforced by `npx prettier --write`.
- Components use PascalCase filenames, hooks start with `use`, helpers stay camelCase, and constants use UPPER_SNAKE_CASE.
- Keep server-only logic in `app/(...)/route.ts` files, avoid `any`, prefer `unknown` plus Zod guards, and export types separately for treeshaking.

## Testing Guidelines

- Vitest specs live in `tests/{unit,integration}` as `*.spec.ts`; Playwright targets port 3001 and writes artifacts to `test-results/`.
- Maintain >=80% logic coverage and log plan changes in `TESTING_IMPLEMENTATION_SUMMARY.md`.
- Use fixtures from `tests/utils`, stub API calls through `apps/api/lib/**`, and favor data builders over brittle IDs.

## Commit & Pull Request Guidelines

- Follow Conventional Commits (example: `feat(auth): add OAuth2 flow`) and mention the primary test command executed.
- PRs must satisfy `.github/pull_request_template.md`: declare type, severity, scope, link any plan artifacts, attach `agents/bundles/{id}` bundles, list risks, and include UI screenshots when relevant.
- Never push directly to `main`; open PRs only after `npm run build`, `npm run lint`, and targeted suites pass.

## Security & Agent Workflow Tips

- Keep secrets out of git, copy `.env.example` into `.env.local`, enforce tenant isolation with RLS filters, and sanitize rendered HTML.
- Run `npm run security:autofix` before releases and avoid storing credentials in fixtures or docs.
- Start automation with `npm run swarm:start "<feature name>"` so PM -> Architect -> QA -> Security agents ship assets in `docs/prd/` and `agents/bundles/`.
