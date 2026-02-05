# Repository Guidelines

## Project Structure & Module Organization

- Turbo workspace layout: `apps/web` is the Next.js App Router UI (port 3001) and `apps/api` is the HTTP API (port 4000).
- UI routes live under `apps/web/app/**` and shared widgets in `apps/web/components/**`.
- API handlers live in `apps/api/app/api/**`, with domain services in `apps/api/lib/**`.
- Shared schema/UI/config live in `packages/*`; update shared packages before app-specific copies.
- Tests live in `tests/{unit,integration,e2e}` with fixtures in `tests/utils`; migrations and docs are in `migrations/` and `docs/`.

## Build, Test, and Development Commands

- `npm run dev -- --filter=@sass-store/web`: run only the web app; drop the filter to run all workspaces.
- `npm run build`, `npm run lint`, `npm run typecheck`: required before any PR.
- `npm run test:unit`, `npm run test:integration`, `npm run test:e2e`: run the respective test suites.
- `npm run test:e2e:subset -- --grep "booking"`: run a narrowed Playwright subset.
- From `apps/api`, run `npm run db:generate`, `npm run db:push`, `npm run db:seed` after schema changes.

## Coding Style & Naming Conventions

- TypeScript is strict, use 2-space indentation and trailing commas; format with `npx prettier --write`.
- Components use PascalCase filenames, hooks start with `use`, helpers are camelCase, constants use UPPER_SNAKE_CASE.
- Keep server-only logic in `app/(...)/route.ts`, avoid `any`, prefer `unknown` with Zod guards.
- Export types separately when possible for tree-shaking.

## Testing Guidelines

- Vitest specs live in `tests/{unit,integration}` as `*.spec.ts`; Playwright targets port 3001.
- Keep logic coverage at or above 80% and log plan changes in `TESTING_IMPLEMENTATION_SUMMARY.md`.
- Use fixtures from `tests/utils`, stub API calls through `apps/api/lib/**`, and prefer data builders.

## Commit & Pull Request Guidelines

- Use Conventional Commits (e.g. `feat(auth): add OAuth2 flow`) and include the primary test command run.
- PRs must follow `.github/pull_request_template.md`: declare type, severity, and scope; link plan artifacts; attach `agents/bundles/{id}`; list risks; add UI screenshots when relevant.
- Never push directly to `main`; open PRs only after build, lint, and targeted tests pass.

## Security & Configuration Tips

- Copy `.env.example` to `.env.local`, keep secrets out of git, and enforce tenant isolation with RLS filters.
- Sanitize rendered HTML and run `npm run security:autofix` before releases.

## Agent Workflow

- Start automation with `npm run swarm:start "<feature name>"` to generate PRD and bundle assets in `docs/prd/` and `agents/bundles/`.
