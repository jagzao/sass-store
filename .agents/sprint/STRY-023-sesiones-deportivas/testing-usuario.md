# Testing de Usuario — STRY-023 Sesiones deportivas

**Spec:** `.specs/sesiones_deportivas.md`  
**Story:** `docs/stories/active/STRY-023-sesiones-deportivas.md`

---

## Credenciales

| Campo    | Valor              |
| -------- | ------------------ |
| Email    | `jagzao@gmail.com` |
| Password | `admin`            |
| Rol      | Admin / staff      |

---

## Tenants activos (multitenancy)

| Slug               | Alcance                                        | Repetir escenarios |
| ------------------ | ---------------------------------------------- | ------------------ |
| `centro-tenistico` | **Obligatorio** — piloto                       | Sí, todos SC       |
| `wondernails`      | **Negativo** — no debe mostrar módulo sesiones | SC-11 solo         |

---

## Precondiciones

1. `npm run dev` en puerto 3001 (o servidor E2E en 3002).
2. Migración `class_sessions` aplicada y seed opcional con 1–2 sesiones de prueba.
3. Health: `GET /api/health` → 200.
4. n8n opcional para SC-10 (verificar fila en BD si n8n no está activo).

---

## Escenarios

### SC-01: Acceso home admin con sesiones (CA-1)

| Paso | Acción                                                            | Resultado esperado                 |
| ---- | ----------------------------------------------------------------- | ---------------------------------- |
| 1    | Login en `/t/centro-tenistico` → ir a `/t/centro-tenistico/admin` | Carga sin 404/500                  |
| 2    | Buscar sección "Sesiones de hoy" (o equivalente)                  | Visible para tenant deportivo      |
| 3    | Verificar al menos una card de sesión                             | Muestra título, hora, cupo `n/max` |

### SC-02: Roster de alumnos en sesión (CA-1)

| Paso | Acción                                  | Resultado esperado             |
| ---- | --------------------------------------- | ------------------------------ |
| 1    | Expandir/abrir una sesión con inscritos | Lista de alumnos con nombre    |
| 2    | Verificar contador cupo                 | Coincide con cantidad en lista |

### SC-03: Marcar asistencia (CA-2)

| Paso | Acción                              | Resultado esperado         |
| ---- | ----------------------------------- | -------------------------- |
| 1    | Marcar palomita ✅ en primer alumno | UI actualiza sin error     |
| 2    | Recargar página                     | Estado asistencia persiste |
| 3    | Desmarcar / marcar ausente          | Cambio persiste            |

### SC-04: Crear sesión — CRUD (CA-3)

| Paso | Acción                                                                         | Resultado esperado  |
| ---- | ------------------------------------------------------------------------------ | ------------------- |
| 1    | Ir a `/t/centro-tenistico/admin/sessions`                                      | Pantalla CRUD carga |
| 2    | Crear sesión: título "Clase prueba STRY-023", mañana 10:00, cupo 8, instructor | Guarda OK           |
| 3    | Verificar en listado admin                                                     | Sesión visible      |
| 4    | Verificar en home sesiones del día (si fecha = hoy)                            | Aparece en home     |

### SC-05: Editar y eliminar sesión (CA-3)

| Paso | Acción                                                           | Resultado esperado                         |
| ---- | ---------------------------------------------------------------- | ------------------------------------------ |
| 1    | Editar sesión creada: cambiar cupo a 6                           | Guarda OK                                  |
| 2    | Eliminar sesión **sin** inscritos                                | Confirmación → desaparece                  |
| 3    | Crear otra sesión, inscribir 1 alumno (SC-06), intentar eliminar | Pide confirmación; al confirmar desaparece |

### SC-06: Inscripción pública (CA-4)

| Paso | Acción                                                   | Resultado esperado           |
| ---- | -------------------------------------------------------- | ---------------------------- |
| 1    | En ventana anónima, ir a `/t/centro-tenistico/sessions`  | Lista sesiones abiertas      |
| 2    | Anotarse: nombre "Alumno Test", teléfono `5255512345678` | Mensaje éxito                |
| 3    | Como admin, abrir roster de esa sesión                   | Aparece "Alumno Test"        |
| 4    | Repetir inscripción mismo teléfono                       | Rechazo amigable (duplicado) |

### SC-07: Cupo lleno (CA-5)

| Paso | Acción                                              | Resultado esperado   |
| ---- | --------------------------------------------------- | -------------------- |
| 1    | Crear sesión con cupo 2                             | —                    |
| 2    | Inscribir 2 alumnos distintos (teléfonos distintos) | Ambos OK             |
| 3    | Intentar tercer alumno                              | Mensaje cupo agotado |

### SC-08: Múltiples alumnos misma sesión (diferenciador)

| Paso | Acción                          | Resultado esperado                                              |
| ---- | ------------------------------- | --------------------------------------------------------------- |
| 1    | Sesión con 3 inscritos          | Los 3 en **una** sesión, no 3 citas separadas en calendario 1:1 |
| 2    | Calendario bookings tradicional | No crea 3 rows booking por la misma clase grupal                |

### SC-09: Permisos (CA-6)

| Paso | Acción                                                       | Resultado esperado |
| ---- | ------------------------------------------------------------ | ------------------ |
| 1    | Usuario no autenticado: `POST .../sessions` (crear)          | 401/403            |
| 2    | Autenticado en CTV: `GET` sesión ID inventado de otro tenant | 404/403            |

### SC-10: Recordatorio 24h encolado (CA-7)

| Paso | Acción                         | Resultado esperado                                                                         |
| ---- | ------------------------------ | ------------------------------------------------------------------------------------------ |
| 1    | Tras SC-06 con teléfono válido | Query `scheduled_notifications`: `template_key = session_reminder_24h`, `status = pending` |
| 2    | `scheduled_at`                 | ≈ `starts_at - 24h`                                                                        |
| 3    | Reprogramar sesión (+2h)       | Recordatorios pending cancelados/re-encolados                                              |

### SC-11: Wondernails — módulo ausente (regresión)

| Paso | Acción                       | Resultado esperado                                                  |
| ---- | ---------------------------- | ------------------------------------------------------------------- |
| 1    | Login `/t/wondernails/admin` | No aparece "Sesiones deportivas" / `/admin/sessions` 404 o redirect |
| 2    | `/t/wondernails/sessions`    | No aplica o 404                                                     |

---

## Matriz negativos (plan robusto)

| Caso                      | Acción                        | Esperado                   |
| ------------------------- | ----------------------------- | -------------------------- |
| Payload inválido          | POST sesión sin `maxCapacity` | ValidationError 400        |
| Cupo 0                    | POST `maxCapacity: 0`         | ValidationError            |
| Asistencia sin enrollment | PATCH attendance ID falso     | NotFound                   |
| Sin teléfono al inscribir | Inscripción solo nombre       | OK sin fila reminder en BD |

---

## A11y y viewport

| ID      | Acción                                       | Esperado                |
| ------- | -------------------------------------------- | ----------------------- |
| A11y-01 | Tab por palomitas y botones en home sesiones | Foco visible            |
| VP-01   | Viewport 375px en `/admin/sessions`          | Sin overflow horizontal |

---

## Playwright CLI

```bash
# Headed — exploración agente
npm run test:e2e:subset -- --headed --grep "sesiones-deportivas|STRY-023"

# Headless — regresión CI
npm run test:e2e:subset -- --grep "sesiones-deportivas"
```

---

## Criterio de cierre (agente § 1.3)

- [ ] Todos SC-01 a SC-11 ejecutados en **centro-tenistico**
- [ ] SC-11 en wondernails
- [ ] Playwright headless verde
- [ ] UT servicios sesión verdes
- [ ] Listo para **visto bueno** del dueño
