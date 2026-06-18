---
name: multi-review
description: >
  Analiza el diff actual desde 3 perspectivas independientes — QA, Arquitectura, Seguridad —
  y produce un reporte consolidado antes de abrir el PR. Inspirado en el PR Review multi-modelo
  de Smelter. Usar cuando el usuario dice "/multi-review", "revisa el PR", "análisis multi-perspectiva",
  o después de que quality-runner diga LISTO PARA PR.
  Compatible con Claude Code y cualquier LLM que lea este archivo.
metadata:
  author: casa-futbol
  version: "1.0"
  language: es
---

# Skill: Multi-Review

Tres revisores independientes analizan el mismo diff. Cada uno tiene un ángulo distinto
y no sabe lo que los otros encontraron — así se evita el sesgo de confirmación.

---

## ANTES DE EMPEZAR

1. Obtén el diff actual:
   ```bash
   git diff main...HEAD --stat
   git diff main...HEAD
   ```
2. Si no hay git o el proyecto no tiene commits: lee los archivos modificados directamente.
3. Lee la spec en `.agents/memory/current-task.md` para saber qué se intentó hacer.

---

## PERSPECTIVA 1 — QA / Tester

**Tu rol:** Eres un QA senior. No te importa cómo está escrito el código — solo si funciona correctamente en todos los casos.

**Analiza el diff buscando:**

- ¿Los tests cubren los criterios de aceptación de la spec? ¿Falta alguno?
- ¿Hay casos borde sin probar? (null, vacío, ID inexistente, usuario sin permisos)
- ¿Los tests son frágiles? (hardcoded IDs, dependencia del orden de ejecución, sleeps)
- ¿Se probaron los flujos de error, no solo el happy path?
- ¿El cambio puede romper algo que ya funcionaba? (regresión)
- ¿Hay algún test que siempre pasaría aunque el código esté mal?

**Formato de salida:**

```
## QA Review

### ✅ Cobertura correcta
- [criterio de aceptación cubierto]

### ⚠️ Gaps de cobertura
- [caso no probado + por qué importa]

### ❌ Riesgos de regresión
- [qué puede romperse y por qué]

### Veredicto QA: APROBADO | OBSERVACIONES | BLOQUEANTE
```

---

## PERSPECTIVA 2 — Arquitecto / Tech Lead

**Tu rol:** Eres el arquitecto del proyecto. Te importa que el código sea correcto estructuralmente y consistente con las decisiones ya tomadas.

**Para sass-store, verifica específicamente:**
- ¿Todo código nuevo usa Result Pattern? (`Ok()`, `Err()`, no `try/catch` en lógica de negocio)
- ¿Los errores son tipos `DomainError` explícitos, no strings genéricos?
- ¿Las rutas bajo `app/t/[tenant]/` mantienen aislamiento de tenant? (no mezclar tenant IDs)
- ¿Las API routes usan `withResultHandler` y validación Zod?
- ¿No se tocó `apps/web/app/api/debug/` en código de producción?
- ¿Los cambios en DB respetan RLS con `tenant_id`?
- ¿Se actualizó `APP_STATE.md` si cambió algún invariante del producto?

**Analiza el diff buscando:**
- Violaciones a las decisiones de arquitectura documentadas en `CLAUDE.md`
- Duplicación de lógica que ya existe en otro módulo
- Acoplamiento innecesario entre capas
- Patrones inconsistentes con el resto del proyecto
- Cambios que afectan más archivos de los necesarios

**Formato de salida:**

```
## Architecture Review

### ✅ Consistente con la arquitectura
- [decisión respetada]

### ⚠️ Inconsistencias menores
- [problema + corrección sugerida]

### ❌ Violaciones de arquitectura
- [violación + impacto]

### Veredicto Arquitectura: APROBADO | OBSERVACIONES | BLOQUEANTE
```

---

## PERSPECTIVA 3 — Seguridad

**Tu rol:** Eres un auditor de seguridad. Buscas vulnerabilidades, fugas de datos y superficies de ataque.

**Analiza el diff buscando:**
- ¿Hay SQL construido por concatenación de strings? (SQL injection)
- ¿Se exponen IDs internos, tokens o datos sensibles en respuestas de API?
- ¿Los endpoints nuevos validan autenticación y autorización?
- ¿Se validan inputs en el boundary (API/formulario) antes de procesarlos?
- ¿Hay credenciales, API keys o secrets hardcodeados?
- ¿Se loguea información sensible (passwords, tokens, PII)?
- ¿Los errores exponen stack traces o detalles internos al cliente?
- ¿CORS, headers de seguridad, rate limiting afectados por el cambio?

**Formato de salida:**

```
## Security Review

### ✅ Sin vulnerabilidades identificadas en
- [área revisada]

### ⚠️ Riesgos menores
- [riesgo + mitigación sugerida]

### ❌ Vulnerabilidades
- [CVE o tipo + línea + impacto + corrección]

### Veredicto Seguridad: APROBADO | OBSERVACIONES | BLOQUEANTE
```

---

## REPORTE CONSOLIDADO

Después de las 3 perspectivas, genera el reporte final:

```
═══════════════════════════════════════════════
MULTI-REVIEW REPORT
Feature: [nombre]
Fecha:   [fecha]
═══════════════════════════════════════════════

VEREDICTOS
  QA:           ✅ APROBADO | ⚠️ OBSERVACIONES | ❌ BLOQUEANTE
  Arquitectura: ✅ APROBADO | ⚠️ OBSERVACIONES | ❌ BLOQUEANTE
  Seguridad:    ✅ APROBADO | ⚠️ OBSERVACIONES | ❌ BLOQUEANTE

HALLAZGOS CRÍTICOS (❌ — bloquean el PR)
  1. [perspectiva] [archivo:línea] — [descripción]

OBSERVACIONES (⚠️ — recomendadas antes del merge)
  1. [perspectiva] — [descripción]

DECISIÓN FINAL
  ✅ LISTO PARA PR — ningún bloqueante
  ⚠️ PR CON OBSERVACIONES — merge con deuda técnica aceptada
  ❌ NO ABRIR PR — resolver bloqueantes primero
═══════════════════════════════════════════════
```

---

## Notas

- Ejecuta las 3 perspectivas en secuencia dentro del mismo contexto.
- Cada perspectiva lee el diff fresca, sin asumir lo que encontró la anterior.
- Si el diff es muy grande (+500 líneas), enfoca cada perspectiva en los archivos más críticos.
- Las observaciones ⚠️ no bloquean el PR pero deben quedar documentadas.
- Solo los ❌ bloquean — el humano decide si acepta las ⚠️.
