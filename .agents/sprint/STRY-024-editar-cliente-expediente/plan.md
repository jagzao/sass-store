# Plan de Ejecución — STRY-024: Editar datos personales del cliente desde el expediente

> **Story:** `docs/stories/active/STRY-024-editar-cliente-expediente.md`
> **Branch:** `feature/STRY-024-editar-cliente-expediente`
> **Creado:** 2026-06-03

---

## 1. Alcance

Agregar un botón **"Editar"** en el componente `CustomerFileHeader` (usado en modal de `CustomersList` / `PendingAppointmentsSection` y en página completa `/t/{tenant}/clientes/{id}`) que permita editar inline todos los datos personales del cliente: **nombre, teléfono, email, cumpleaños, dirección, estado**.

---

## 2. Archivos a tocar

| #   | Archivo                                                                | Capa | Cambio                                                                  |
| --- | ---------------------------------------------------------------------- | ---- | ----------------------------------------------------------------------- |
| 1   | `apps/web/components/customers/CustomerFileHeader.tsx`                 | UI   | Agregar botón Editar, inputs inline, validación, cancelar               |
| 2   | `apps/web/app/api/tenants/[tenant]/customers/[id]/route.ts`            | API  | Verificar que `birthday` y `status` se persisten correctamente en PATCH |
| 3   | `tests/e2e/customers/stry-024-editar-cliente.spec.ts`                  | E2E  | Happy path, validación, cancelar, error                                 |
| 4   | `tests/unit/components/CustomerFileHeader.spec.ts`                     | UT   | Montar, editar, guardar, cancelar                                       |
| 5   | `.agents/sprint/STRY-024-editar-cliente-expediente/testing-usuario.md` | QA   | Pasos reproducibles por tenant                                          |

---

## 3. Pasos numerados

### Paso 1: Análisis del estado actual

- [ ] Leer `CustomerFileHeader.tsx` completo.
- [ ] Confirmar que `editing`, `handleSave`, `editedName`, `editedPhone`, `editedEmail`, `editedAddress`, `editedTags`, `editedNotes` ya existen.
- [ ] Confirmar que faltan: `editedBirthday`, `editedStatus`, y un **botón visible para activar `editing=true`**.

### Paso 2: Extender estado de edición

- [ ] Agregar `editedBirthday` y `editedStatus` al estado local.
- [ ] Inicializarlos desde `customer.birthday` y `customer.status` en `useEffect`.

### Paso 3: Agregar botón "Editar"

- [ ] En modo lectura, mostrar botón "Editar" (icono `Pencil` de lucide-react) junto al badge de estado.
- [ ] `onClick={() => setEditing(true)}`.
- [ ] Ocultar el botón cuando `editing === true`.

### Paso 4: Inputs inline en modo edición

- [ ] `name`: Input (ya existe, verificar que siga ahí).
- [ ] `phone`: Input (ya existe).
- [ ] `email`: Input (ya existe).
- [ ] `birthday`: Nuevo `<input type="date">` en modo edición.
- [ ] `address`: Input (ya existe).
- [ ] `status`: Nuevo `<select>` con opciones Activa / Inactiva / Bloqueada en modo edición.
- [ ] Botones "Guardar cambios" y "Cancelar" en modo edición.

### Paso 5: Validación en `handleSave`

- [ ] Validar que `editedName.trim() !== ""` y `editedPhone.trim() !== ""`.
- [ ] Validar que `editedEmail` sea vacío o email válido (regex simple).
- [ ] Si falla validación: mostrar error inline (no alert), no hacer fetch.

### Paso 6: Cancelar edición

- [ ] `handleCancel`: `setEditing(false)` y revertir todos los `edited*` a valores originales de `customer`.

### Paso 7: Manejo de errores de API

- [ ] Si `PATCH` falla: mostrar mensaje de error inline (banner rojo debajo del header), permanecer en modo edición.

### Paso 8: Sincronizar API

- [ ] Verificar que `route.ts` PATCH incluye `birthday` y `status` en `updateCustomerSchema` y en `.set({ ...data })`.
- [ ] Confirmar que `birthday` llega como string YYYY-MM-DD y se persiste.

### Paso 9: Tests unitarios

- [ ] Crear `tests/unit/components/CustomerFileHeader.spec.ts`.
- [ ] Casos: render lectura, click Editar → inputs visibles, guardar con datos válidos, guardar con nombre vacío → error, click Cancelar → vuelve a lectura.

### Paso 10: Tests E2E

- [ ] Crear `tests/e2e/customers/stry-024-editar-cliente.spec.ts`.
- [ ] Tag `@stry-024` en describe.
- [ ] Casos: happy path editar y guardar, validación nombre vacío, cancelar edición.

### Paso 11: Build / lint / typecheck

- [ ] `npm run build`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test:unit`

### Paso 12: Playwright headed

- [ ] `npm run dev` en background.
- [ ] `npm run test:e2e:subset -- --headed --grep "STRY-024"`.
- [ ] Inspeccionar visualmente, corregir bugs.

### Paso 13: Playwright headless

- [ ] `npm run test:e2e:subset -- --grep "STRY-024"`.
- [ ] Debe pasar limpio.

---

## 4. Riesgos y mitigaciones

| Riesgo                                                         | Probabilidad | Impacto | Mitigación                                       |
| -------------------------------------------------------------- | ------------ | ------- | ------------------------------------------------ |
| `birthday` no se persiste en DB porque el schema no lo tiene   | Baja         | Alto    | Verificar schema de customers antes de codificar |
| Cambios en `CustomerFileHeader` rompen modal y página completa | Media        | Medio   | Testar ambos contextos (modal + página)          |

---

## 5. Asunciones / defaults

- La edición es **inline** (no navega a otra página).
- El botón se coloca **al lado del badge de estado** en el header.
- Cualquier usuario autenticado del tenant puede editar.
- `birthday` se almacena como string `YYYY-MM-DD` (mismo formato que `CustomerForm`).

---

## 6. Definición de "hecho" por paso

- Paso 1–2: Estado compilable, campos nuevos inicializados.
- Paso 3–7: UI funcional en Storybook / navegador manual.
- Paso 8: API responde 200 con `birthday` y `status` actualizados.
- Paso 9: UT ≥80% en `CustomerFileHeader`.
- Paso 10–13: E2E headless verde, build/lint/tc verde.
