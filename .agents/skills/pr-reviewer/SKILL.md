---
name: pr-reviewer
description: >-
  Reviews pull requests and post-agent delivery for sass-store: code quality,
  Result Pattern, multitenancy, security, and alignment with User Story AC and
  plan.md. Use when the user asks for a PR review, reviewer pass, "revisa el PR",
  pre-merge checklist, or after the agent reports "listo para revisión" (AGENTS.md § 3).
---

# PR / entrega reviewer (sass-store)

Skill para el rol **reviewer** distinto del QA Playwright ya ejecutado por el agente: aquí se revisa **diff**, **riesgos**, **convenciones del repo** y **coherencia con la US** antes de merge o visto bueno final.

## Cuándo usar

- Tras mensaje **"Listo para revisión"** (implementación + UT + Playwright verdes por el agente).
- Usuario pide: `revisa el PR`, `reviewer`, `pre-merge`, `valida el diff`.
- Antes de **visto bueno** del dueño si el equipo separa "revisión técnica" de "aprobación de producto".

## Lectura previa (mínimo viable)

1. Descripción del PR / lista de commits o `git diff` / archivos tocados.
2. `docs/stories/active/STRY-XXX-*.md` si el PR declara story.
3. `.agents/sprint/{STRY-XXX-*}/plan.md` y `implementacion.md` — comprobar que el diff cubre lo prometido.
4. `AGENTS.md` (Result Pattern, multitenancy, DoD § 1.2–1.4).
5. Si toca datos/API: `.agents/protocols/multitenancy.md` o skill **multitenant-guard** en mente.

## Checklist de revisión (orden sugerido)

### A. Alcance y trazabilidad

- [ ] El cambio **mapea a AC** de la US o al `plan.md` (sin scope creep no documentado).
- [ ] No hay TODOs críticos ni código muerto accidental en rutas públicas.

### B. Result Pattern y API

- [ ] Código **nuevo** en lógica de negocio: `Result` / `ErrorFactories`, no `try/catch` de negocio (`AGENTS.md`).
- [ ] Handlers API: `withResultHandler` donde aplique el patrón del archivo.
- [ ] Errores hacia cliente: **sin** stack traces ni datos sensibles; mensajes seguros.

### C. Multitenancy y seguridad

- [ ] Queries y APIs: **filtro por tenant** / contexto RLS coherente con el resto del módulo.
- [ ] No nuevas lecturas de datos cross-tenant (cookies, headers, `tenant` en query).
- [ ] Mutaciones: CSRF / validación de origen según `middleware` del repo.
- [ ] Secretos: ningún valor real en diff; env solo referenciados.

### D. Rendimiento y DX

- [ ] Evitar N+1 obvio, `getTenant*` duplicado innecesario en mismo request (señalar, no bloquear por micro-optimización).
- [ ] Imports y bundles: evitar arrastrar server-only a client components.

### E. Tests y evidencia

- [ ] El agente ya dejó **UT + E2E** verdes: revisar que los tests **tienen sentido** (no solo `expect(true)`).
- [ ] Si el PR omite tests en lógica nueva: **request changes** o exigir cobertura mínima según `AGENTS.md`.

### F. Calidad de repo

- [ ] `npm run lint`, `typecheck`, `build` razonables para el tamaño del PR (o CI verde enlazado).

## Salida esperada (formato)

Responder con bloques fijos:

```markdown
## Resumen

1–3 frases: aprobar / cambios solicitados / bloquear.

## Hallazgos

| Severidad  | Archivo | Tema | Acción |
| ---------- | ------- | ---- | ------ |
| Must-fix   | …       | …    | …      |
| Should-fix | …       | …    | …      |
| Nit        | …       | …    | …      |

## Verificación multitenancy / seguridad

- [ ] OK / [ ] Riesgo: …

## Resultado

**Approve** | **Request changes** | **Block** — motivo en una frase.
```

## Relación con otros roles

| Rol                       | Responsabilidad                                                                  |
| ------------------------- | -------------------------------------------------------------------------------- |
| Agente QA                 | Playwright headed/headless + `testing-usuario.md` (ya hecho antes del reviewer). |
| **Reviewer (esta skill)** | Calidad del diff, riesgos, convenciones, alineación US.                          |
| Dueño / PO                | **Visto bueno** de producto; no sustituye Playwright ni este checklist técnico.  |

## No hacer

- No repetir toda la suite E2E como si el agente no la hubiera corrido (salvo desconfianza fundada → pedir re-run explícito de un grep acotado).
- No aprobar merge a `main` si el proceso del equipo exige otra política (el reviewer documenta; el humano hace click).
