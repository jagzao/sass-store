# Security — Sass Store

## Estado General

Plan maestro de remediación en `docs/SECURITY_REMEDIATION_MASTER_PLAN.md`.

## Hallazgos Activos

| Severidad     | Count | Story owner         |
| ------------- | ----- | ------------------- |
| CRITICAL (P1) | 8     | STRY-019 / STRY-017 |
| HIGH          | 1     | STRY-017            |
| MEDIUM        | 4     | STRY-017            |
| LOW           | 1     | backlog             |

## Principios Clave

1. **Row Level Security (RLS)** — Todas las queries de negocio filtran por `tenant_id`.
2. **Secrets** — `.env` y `.env.local` están en `.gitignore`; rotación gestionada en STRY-019.
3. **Auth** — NextAuth v5 con Google OAuth y email/password bcrypt.
4. **Headers** — CSP, HSTS, X-Frame-Options implementados en `next.config.js`.
5. **Rate limiting** — Upstash Redis para rate limits por IP y tenant.

## Comandos de Auditoría

```bash
npm run security:quick
npm run security:autofix
npm run security:check-deps
```

## Incident Response

Ver `docs/INCIDENT_TRIAGE.md`.

## Buenas Prácticas

- No exponer `stack trace` en producción.
- Sanitizar HTML renderizado.
- Tokens OAuth almacenados en `jsonb` cifrado (tenant).
- API keys: prefijo visible, hash completo en DB.

---

_Actualizado: 2026-05-31 — Remediación en progreso bajo STRY-019 y STRY-017._
