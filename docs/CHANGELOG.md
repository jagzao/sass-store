# Changelog — Sass Store

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to a simplified calendar versioning.

---

## [2026-05-31] Quality OS Compliance (STRY-022)

### Added

- `docs/ROADMAP.md`, `docs/USER-STORIES.md`, `docs/ACCEPTANCE-CRITERIA.md`, `docs/API-SPEC.md`, `docs/DATABASE.md`, `docs/TEST-PLAN.md`, `docs/SECURITY.md`, `docs/DEPLOYMENT.md`, `docs/QUALITY-REPORT.md`, `docs/CHANGELOG.md`.
- `.agents/guards/quality-os-rules.md` y `.agents/guards/common-guards.md`.
- `quality.config.json` en raíz del proyecto.
- Dashboard interno `/admin/quality` con métricas Quality OS.
- API `/api/system/quality` para consumo del dashboard.

### Changed

- `AGENTS.md`: nueva regla de análisis de `.agent-reports` → actualizar STRY-022.
- `docs/stories/BACKLOG.md`: registrada STRY-022 en backlog y active.

### Fixed

- Incidencias de documentación faltante detectadas por Quality OS (excepto secretos, gestionados en STRY-019).

## [2026-05-13] Security & Performance Hardening (STRY-021/017)

### Added

- CSP strict-dynamic + nonce support.
- Health endpoint `/api/health`.
- Finance logger con dedup.

### Fixed

- Middleware featureMode/locale/currency forwarding.
- Google Fonts TLS fallback para build local.

## [2026-05-07] System Status Panel (STRY-020)

### Added

- Admin system status panel + incident triage docs.
- Domain loggers con dedup y env-aware levels.

### Fixed

- 404 logos: SVG logos + remap de placeholder URLs.
- Cart/session polling excesivo: debounced save + pass userId.

## [2026-04-28] POS Robusto E2E (STRY-001)

### Added

- Flujo POS completo con cierre de turno (E2E verificado).
- Retouch system validation.
- Result Pattern adoption guide (`docs/RESULT_PATTERN_GUIDE.md`).

## [2026-02-27] Security Remediation Plan

### Added

- `SECURITY_REMEDIATION_MASTER_PLAN.md` con matriz de 14 issues.
- RLS policies masivas.
- Audit trail inicial.

---

_Actualizado: 2026-05-31 — Para historial completo de commits ver `git log`._
