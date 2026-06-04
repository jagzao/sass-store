# Story: STRY-024 — Editar datos personales del cliente desde el expediente

> **ID:** STRY-024
> **Estado:** active
> **Prioridad:** P1
> **Sprint:** S2
> **Asignado:** Dev
> **Creado:** 2026-06-03
> **Actualizado:** 2026-06-03

**Artefactos de sprint:** `.agents/sprint/STRY-024-editar-cliente-expediente/` con `plan.md`, `implementacion.md`, `testing-usuario.md`.

---

## 1. Narrativa

Como **usuario del sistema (admin o staff)**, quiero **poder editar todos los datos personales de una clienta directamente desde su expediente**, para que **pueda mantener su información actualizada sin salir del contexto de su historial**.

### Contexto

Hoy el expediente de cliente (`CustomerFileHeader`) muestra los datos personales en modo solo lectura. Existe un estado `editing` y un `handleSave` que hace `PATCH` a la API, pero **no hay botón visible que active el modo edición** y además faltan campos editables como **cumpleaños** y **estado** en la edición inline. El objetivo es exponer esta capacidad con un flujo claro: click en "Editar" → campos editables inline → "Guardar cambios" / "Cancelar".

---

## 2. Criterios de Aceptación (Gherkin)

### CA-1: Happy path — Editar datos personales

```gherkin
Dado que estoy viendo el expediente de una clienta
Cuando hago clic en el botón "Editar"
Entonces los campos personales (nombre, teléfono, email, cumpleaños, dirección, estado) se vuelven editables inline
Y puedo modificar los valores
Y al hacer clic en "Guardar cambios" se persisten los datos
Y se muestra un mensaje de éxito
```

### CA-2: Validación — Campos obligatorios

```gherkin
Dado que estoy en modo edición del expediente
Cuando dejo el nombre o teléfono vacíos y hago clic en "Guardar cambios"
Entonces se muestra un error de validación
Y no se guarda ningún cambio
```

### CA-3: Cancelar edición

```gherkin
Dado que estoy en modo edición del expediente
Cuando hago clic en "Cancelar"
Entonces se descartan todos los cambios no guardados
Y el expediente vuelve al modo solo lectura
Y los campos muestran los valores originales
```

### CA-4: Error de API

```gherkin
Dado que estoy en modo edición del expediente
Cuando la API de actualización falla (500, timeout, etc.)
Entonces se muestra un mensaje de error en pantalla
Y permanezco en modo edición para corregir y reintentar
```

### CA-5: Multitenancy

```gherkin
Dado que estoy en el tenant "wondernails"
Cuando edito una clienta de ese tenant
Entonces la actualización afecta solo a ese tenant
Y no impacta clientas de otros tenants
```

---

## 3. Mockups / Wireframes

- Wireframe local: `design/wireframes/STRY-024.md` (no aplica — UI existente)
- Mockup de referencia: screenshots adjuntas del expediente actual

---

## 4. Contrato Técnico (API)

### Endpoint

```
PATCH /api/tenants/{tenant}/customers/{id}
```

### Request (Zod Schema — ya existe)

```typescript
const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().or(z.literal("")).optional(),
  generalNotes: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(["active", "inactive", "blocked"]).optional(),
  tags: z.array(z.string()).optional(),
  birthday: z.string().optional(),
  medicalHistory: z.any().optional(),
});
```

### Response

```typescript
type Response = { customer: Customer };
```

**Nota:** El endpoint ya soporta `birthday` y `status`. No requiere cambios de API.

### DomainError Variants

- `ValidationError` — input inválido (nombre/teléfono vacíos, email malformado)
- `NotFoundError` — cliente no existe
- `DatabaseError` — fallo de persistencia

---

## 5. Impacto Multitenancy

- [ ] Nueva tabla con `tenant_id`
- [ ] Nueva RLS policy
- [ ] Modifica queries existentes
- [x] Sin impacto en DB
- [x] **Tenant de prueba E2E:** wondernails

---

## 6. Plan de Implementación

> Detalle operativo en `.agents/sprint/STRY-024-editar-cliente-expediente/plan.md`.

### Fase 1: UI — CustomerFileHeader

- [ ] Agregar botón "Editar" visible en modo lectura (al lado del badge de estado).
- [ ] Al activar edición: mostrar inputs para `name`, `phone`, `email`, `birthday`, `address`, `status`.
- [ ] Al guardar: validar nombre y teléfono no vacíos; llamar `handleSave` existente.
- [ ] Al cancelar: revertir a valores originales.
- [ ] Mostrar errores de validación / API inline.

### Fase 2: Sincronización de estado

- [ ] Asegurar que `birthday` se reciba de la API GET y se envíe en PATCH.
- [ ] Asegurar que `status` sea editable inline con un `<select>`.

### Fase 3: Tests

- [ ] Tests unitarios para `CustomerFileHeader` (mount, edición, guardado, cancelar).
- [ ] Tests E2E Playwright: happy path + validación + cancelar + error.

### Fase 4: QA

- [ ] `testing-usuario.md` alineado a AC.
- [ ] Playwright headed + headless verde.
- [ ] Build / lint / typecheck verde.

---

## 7. Checklist de Calidad

- [ ] Tests unitarios ≥80% cobertura en archivos nuevos/modificados
- [ ] Tests E2E pasando (sin skips)
- [ ] Result Pattern en lógica nueva (si se crea servicio)
- [ ] `tenant_id` filtrado en todas las queries (ya existe en API)
- [ ] `npm run build` sin errores
- [ ] `npm run lint` sin errores
- [ ] `npm run typecheck` sin errores
- [ ] Documentación actualizada (`AGENTS.md`, summaries)
- [ ] **§ 1.3:** `testing-usuario.md` derivado de la US, entorno levantado, `jagzao@gmail.com`/`admin` en wondernails, todos los escenarios ejecutados con éxito por el agente
- [ ] **Visto bueno del dueño** antes de `Estado: done` y push/publicar

---

## 8. Métricas de Éxito

| Métrica                  | Target | Actual |
| ------------------------ | ------ | ------ |
| Tiempo de implementación | < 4 h  | —      |
| Tests unitarios          | ≥ 4    | —      |
| Tests E2E                | ≥ 3    | —      |
| Cobertura                | ≥80%   | —      |

---

## 9. Notas y Riesgos

- **Riesgo bajo:** La API PATCH ya soporta los campos. Solo hay que exponerlos en UI.
- **Deuda técnica:** `CustomerFileHeader` usa `try/catch` en lugar de Result Pattern. Como es código existente que solo se extiende, no se migra en esta US (alcance acotado).

---

**Orquestador:** Al recibir esta story, ejecutar `kilo run story --id STRY-024` → PM → Architect → Dev → QA (agente, Playwright CLI) → visto bueno del dueño → `done` → push/publicar.
