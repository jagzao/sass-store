# Testing de Usuario — STRY-024: Editar datos personales del cliente desde el expediente

> **Story:** `docs/stories/active/STRY-024-editar-cliente-expediente.md`
> **Plan:** `.agents/sprint/STRY-024-editar-cliente-expediente/plan.md`
> **Tenant de prueba:** wondernails
> **Credencial:** jagzao@gmail.com / admin

---

## Precondiciones

1. Servidor corriendo en `http://localhost:3001`.
2. Tenant `wondernails` activo con al menos una clienta.
3. Usuario autenticado con rol admin o staff.

---

## Escenarios

### ESC-01: Happy path — Editar y guardar datos personales

| Paso | Acción                                                                                    | Resultado esperado                                            |
| ---- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 1    | Ir a `/t/wondernails/clientes`                                                            | Lista de clientas visible                                     |
| 2    | Hacer clic en el nombre de una clienta                                                    | Se abre el expediente (modal o página)                        |
| 3    | Hacer clic en **"Editar"**                                                                | Campos personales se vuelven editables inline                 |
| 4    | Modificar **nombre**, **teléfono**, **email**, **cumpleaños**, **dirección** y **estado** | Inputs aceptan los nuevos valores                             |
| 5    | Hacer clic en **"Guardar cambios"**                                                       | Se muestra indicador de guardado, luego vuelve a modo lectura |
| 6    | Verificar que los datos actualizados se muestran                                          | Nombre, teléfono, etc. reflejan los cambios                   |
| 7    | Recargar página                                                                           | Los datos persisten (confirmar persistencia en DB)            |

### ESC-02: Validación — Nombre y teléfono obligatorios

| Paso | Acción                                      | Resultado esperado                                       |
| ---- | ------------------------------------------- | -------------------------------------------------------- |
| 1    | Activar modo edición                        | Inputs visibles                                          |
| 2    | Borrar el campo **nombre**                  | Dejar vacío                                              |
| 3    | Hacer clic en **"Guardar cambios"**         | Se muestra mensaje "El nombre es obligatorio."           |
| 4    | Borrar el campo **teléfono**, llenar nombre | Dejar vacío                                              |
| 5    | Hacer clic en **"Guardar cambios"**         | Se muestra mensaje "El teléfono es obligatorio."         |
| 6    | Ingresar email inválido (`abc`)             | Input con valor inválido                                 |
| 7    | Hacer clic en **"Guardar cambios"**         | Se muestra mensaje "El correo electrónico no es válido." |

### ESC-03: Cancelar edición

| Paso | Acción                       | Resultado esperado                                                |
| ---- | ---------------------------- | ----------------------------------------------------------------- |
| 1    | Activar modo edición         | Inputs visibles                                                   |
| 2    | Modificar varios campos      | Valores cambiados en inputs                                       |
| 3    | Hacer clic en **"Cancelar"** | Vuelve a modo lectura, los campos muestran los valores originales |

### ESC-04: Multitenancy — No cross-tenant

| Paso | Acción                                                             | Resultado esperado              |
| ---- | ------------------------------------------------------------------ | ------------------------------- |
| 1    | Editar clienta en `wondernails`                                    | Cambios guardados correctamente |
| 2    | Verificar que no afecta a otra clienta con mismo ID en otro tenant | Datos del otro tenant intactos  |

### ESC-05: Modal vs página completa

| Paso | Acción                                                         | Resultado esperado                 |
| ---- | -------------------------------------------------------------- | ---------------------------------- |
| 1    | Abrir expediente desde **"Clientas por confirmar"** (modal)    | Botón "Editar" visible y funcional |
| 2    | Abrir expediente desde **lista de clientas → página completa** | Botón "Editar" visible y funcional |

---

## Comandos de validación

```bash
# Tests unitarios
npm run test:unit -- --grep "CustomerFileHeader"

# E2E headed (inspección visual)
npm run test:e2e:subset -- --headed --grep "STRY-024"

# E2E headless (regresión)
npm run test:e2e:subset -- --grep "STRY-024"
```

---

## Checklist de QA

- [ ] ESC-01 ejecutado y verde
- [ ] ESC-02 ejecutado y verde
- [ ] ESC-03 ejecutado y verde
- [ ] ESC-04 ejecutado y verde
- [ ] ESC-05 ejecutado y verde
- [ ] Build sin errores
- [ ] Lint sin errores
- [ ] Typecheck sin errores
- [ ] UT sin regresiones

---

**Agente QA:** Ejecutar todos los escenarios en `wondernails` con credencial `jagzao@gmail.com` / `admin`. Documentar cualquier fallo en `implementacion.md` con screenshot o log.
