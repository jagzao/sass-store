# Deployment Guide — Sass Store

## Plataforma

Vercel (Frontend + API routes + Edge functions).
Base de datos: Supabase PostgreSQL.

## Pre-requisitos

- Node >= 18.0.0
- `npm@9.8.1` (packageManager definido en package.json)
- Cuenta Vercel vinculada al repo
- Variables de entorno configuradas en Vercel dashboard

## Variables de Entorno Requeridas

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `MERCADOPAGO_ACCESS_TOKEN`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `RESEND_API_KEY`
- `AWS_S3_*` (opcional, para media pipeline)
- `SENTRY_DSN` (opcional)

## Despliegue

```bash
# Build local
npm run build

# Deploy manual (si no es por git push)
vercel --prod
```

## Pipeline CI/CD

- GitHub Actions: `.github/workflows/`
- Backup automático: `.github/workflows/supabase-backup.yml`
- Build en cada PR; merge a `main` dispara deploy a producción.

## Rollback

- Revertir commit + push → Vercel redeploya.
- Backup DB antes de deploy críticos: usar `scripts/backup-database.js`.

## Environments

| Environment | URL pattern                          | Uso              |
| ----------- | ------------------------------------ | ---------------- |
| Local       | localhost:3001                       | Desarrollo       |
| Preview     | `*.vercel.app`                       | PRs              |
| Staging     | `staging.*.vercel.app`               | QA previo a prod |
| Production  | dominio custom (ej. `zo-system.com`) | Producción       |

## Post-deploy Smoke

```bash
npm run test:smoke
```

---

_Actualizado: 2026-05-31 — Ver `docs/PRODUCTION_DEPLOYMENT_PLAN.md` para detalle de hardening._
