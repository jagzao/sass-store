---
# MANUAL REPRODUCTION STEPS — [STRY-XXX: Feature Name]
# Generado por el agente al cerrar la tarea. Permite a cualquier humano replicar
# el escenario sin contexto adicional.
# Guardar en: tests/evidence/[STRY-XXX]/MANUAL_REPRODUCTION_STEPS.md
---

## Prerrequisitos

- Node.js >= 20, npm >= 10
- Variables de entorno: `.env.local` configurado (ver `.env.example`)
- Base de datos accesible (Supabase remota o local)
- Tenant de prueba: `[wondernails | vigistudio | ...]`

## Cómo levantar el proyecto

```bash
npm install
npm run dev
# Esperar mensaje: "Ready on http://localhost:3001"
```

## Pasos para reproducir el flujo validado

> Ejecutar en orden. Cada paso debe completarse antes del siguiente.

**Paso 1 — [Descripción de la acción]**

- Ir a: `http://localhost:3001/t/[tenant]/[ruta]`
- Hacer: [clic en X / llenar campo Y con valor Z]
- Resultado esperado: [descripción exacta de lo que debe verse]

**Paso 2 — [Descripción de la acción]**

- Hacer: [acción]
- Resultado esperado: [descripción]

**Paso N — Verificar persistencia**

- Recargar la página (`F5` o `Ctrl+R`)
- Resultado esperado: los datos del paso anterior siguen visibles

## Reproducción del bug (pre-fix)

> Completar cuando la validación post-implementación detecta un fallo, **antes** de aplicar el fix.  
> Evidencia Playwright: trace + screenshots en `test-results/`; comando usado en la tabla de `implementacion.md`.

**Síntoma observado:**

- [Qué ve el usuario; URL; tenant]

**Esperado vs actual:**

- Esperado: [CA o fila de testing-usuario.md]
- Actual: [comportamiento observado]

**Pasos para reproducir (Playwright CLI headed):**

1. [Comando: `npx playwright test --headed --grep "STRY-XXX" --trace on`]
2. [Paso manual equivalente en la UI]
3. [Screenshot: `test-results/stry-xxx-repro-N.png`]

## Caso de error validado

**Cómo reproducir el error:**

- [Paso para provocar el caso de error, ej: submit con formulario vacío]

**Resultado esperado:**

- [Mensaje de error visible, toast, validación inline]

## Evidencia disponible

| Artefacto                 | Ruta                                                   |
| ------------------------- | ------------------------------------------------------ |
| Screenshot estado inicial | `tests/evidence/[STRY-XXX]/screenshots/01-initial.png` |
| Screenshot tras submit    | `tests/evidence/[STRY-XXX]/screenshots/02-success.png` |
| API request + response    | `tests/evidence/[STRY-XXX]/api-proof.json`             |
| Build log                 | `tests/evidence/[STRY-XXX]/build.log`                  |
| Unit test results         | `tests/evidence/[STRY-XXX]/unit-tests.log`             |

## Riesgos y notas

- [Cualquier comportamiento no obvio, condición de carrera, o limitación conocida]
- [Cualquier deuda técnica generada por el fix]
