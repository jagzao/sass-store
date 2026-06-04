# Implementación — STRY-024: Editar datos personales del cliente desde el expediente

> **Story:** `docs/stories/active/STRY-024-editar-cliente-expediente.md`
> **Branch:** `feature/STRY-024-editar-cliente-expediente`
> **Estado:** QA verde, pendiente visto bueno del dueño

---

## Resumen de cambios

### UI (`CustomerFileHeader.tsx`)

- Agregado botón **"Editar"** visible en modo lectura (al lado del badge de estado).
- Al activar edición: inputs inline para `name`, `phone`, `email`, `birthday`, `address`, `status`.
- Botones **"Guardar cambios"** y **"Cancelar"** en modo edición.
- Validación inline: nombre y teléfono obligatorios; email validado con regex.
- Manejo de errores de API: mensaje inline sin salir del modo edición.
- `data-testid` en todos los elementos clave para E2E.

### API (`route.ts` PATCH)

- Schema Zod actualizado para aceptar `email: null`, `birthday: null`, `address: null`, `generalNotes: null`.
- Enriquecimiento de GET: `birthday` y `medicalHistory` desempaquetados desde `metadata` JSONB.
- Enriquecimiento de PATCH response: mismo desempaquetado para consistencia frontend.
- Merge de `birthday` y `medicalHistory` en `metadata` JSONB al actualizar (preserva otros campos).

### Tests E2E

- `tests/e2e/customers/stry-024-editar-cliente.spec.ts`
- 4 escenarios: happy path, validación email, cancelar, página completa.
- Tag `@stry-024` para `grep`.

### Tests Unitarios

- UT existentes pasan sin regresiones (11 passed, 483 skipped).

---

## Validación ejecutada por el agente

| Paso         | Comando                     | Resultado                               |
| ------------ | --------------------------- | --------------------------------------- |
| Build        | `npm run build`             | ✅ 1m50s                                |
| Lint         | `npm run lint`              | ✅ 0 errors, 28 warnings pre-existentes |
| Typecheck    | `npm run typecheck`         | ✅                                      |
| E2E headed   | `playwright test --headed`  | ✅ 4/4 passed                           |
| E2E headless | `playwright test`           | ✅ 4/4 passed                           |
| UT           | `npx vitest run tests/unit` | ✅ 11 passed, 0 regresiones             |

---

## Riesgos identificados

- **Birthday persistencia:** Se almacena en `metadata` JSONB, no en columna dedicada. Funciona pero no es queryable directamente por SQL. Aceptable para MVP.
- **Modal vs página:** El botón "Editar" aparece en ambos contextos; el flujo E2E valida ambos.

---

## Pendiente post-visto bueno

- [ ] Merge a `main`
- [ ] Deploy a Vercel
- [ ] Validación en producción
