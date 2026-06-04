# Testing de Usuario — STRY-021 Security & Performance Hardening

> Este documento es para la validación humana (QA / dueño del producto).
> No es para el agente codificador — es el checklist de aceptación final.

---

## Criterios de Aceptación (DoD — Definition of Done)

### 🔴 Bloque A — Endpoints de debug eliminados (OBLIGATORIO)

Abrir el navegador o Postman y verificar:

| Request                                                                 | Resultado esperado                              | ✓/✗ |
| ----------------------------------------------------------------------- | ----------------------------------------------- | --- |
| `GET /api/diagnose/user-check?email=cualquier@email.com&password=admin` | `{"error":"Not found"}` con status **404**      |     |
| `GET /api/debug/auth-check`                                             | `{"error":"Not found"}` con status **404**      |     |
| `POST /api/debug/seed-e2e` sin body                                     | **404** en producción, **401** en dev sin token |     |

---

### 🔴 Bloque B — Upload requiere autenticación

| Escenario                                             | Resultado esperado           | ✓/✗ |
| ----------------------------------------------------- | ---------------------------- | --- |
| `POST /api/upload` sin estar logueado                 | Status **401**               |     |
| `POST /api/upload` estando logueado con imagen válida | Upload exitoso (200 con URL) |     |

---

### 🔴 Bloque C — Flujos de usuario no deben haberse roto

Recorrer visualmente los flujos críticos:

| Flujo                      | Tenant                  | Resultado esperado                | ✓/✗ |
| -------------------------- | ----------------------- | --------------------------------- | --- |
| Landing pública            | `/t/wondernails/`       | Carga sin errores                 |     |
| Crear nueva cita (booking) | wondernails             | Formulario funciona, cita se crea |     |
| Admin: ver agenda          | `/t/wondernails/admin/` | Lista de citas visible            |     |
| Admin: subir logo (upload) | wondernails → Settings  | Upload funciona si logueado       |     |
| Landing pública            | `/t/centro-tenistico/`  | Carga sin errores                 |     |
| Checkout / pagos           | wondernails             | MercadoPago se abre correctamente |     |
| Login con Google           | cualquier tenant        | OAuth fluye sin error             |     |

---

### ⚡ Bloque D — Mejora de rendimiento perceptible

Abrir DevTools → Network → verificar:

| Métrica                                                   | Antes (referencia) | Esperado después        | ✓/✗ |
| --------------------------------------------------------- | ------------------ | ----------------------- | --- |
| TTFB en `/t/wondernails/`                                 | > 1.5s             | < 800ms                 |     |
| Logs "[TenantService]" en consola del servidor al navegar | 15-20 mensajes     | < 5 mensajes            |     |
| Segunda visita al mismo tenant (caché)                    | igual que primera  | Notoriamente más rápido |     |

---

### 🟡 Bloque E — Diagnose endpoints protegidos en staging

Si hay entorno de preview/staging, verificar:

| Request                                                                     | Resultado esperado | ✓/✗ |
| --------------------------------------------------------------------------- | ------------------ | --- |
| `GET /api/diagnose/env` sin token en preview                                | **401** o **404**  |     |
| `GET /api/diagnose/env` con `x-diagnose-token: [valor correcto]` en preview | Respuesta normal   |     |
| `GET /api/diagnose/env` en producción                                       | **404** siempre    |     |

---

## Regresiones que NO deben ocurrir

Si alguna de las siguientes cosas falla después del deploy, la US NO está
completa y debe rollbackearse:

- [ ] Login (Google OAuth o email+password) deja de funcionar
- [ ] Tenants no resuelven correctamente (wondernails, centro-tenistico, etc.)
- [ ] Las citas (bookings) no se crean
- [ ] El admin no puede acceder a su panel
- [ ] Las notificaciones de WhatsApp dejan de enviarse
- [ ] El POS (ventas) deja de funcionar
- [ ] Cualquier ruta devuelve pantalla en blanco

---

## Verificación de seguridad manual (pentesting básico)

Estas pruebas se hacen directamente en el navegador o con curl:

### Prueba de enumeración de usuarios

```bash
# Antes del fix: devolvía { exists: true, email: "...", hasPassword: true }
# Después del fix: debe devolver 404
curl https://[tu-dominio]/api/diagnose/user-check?email=admin@test.com
# Esperado: {"error":"Not found"}
```

### Prueba de internal header spoofing

```bash
# Antes: x-internal-request: true permitía bypasear tenant resolution
# Después: el header es ignorado
curl -H "x-internal-request: true" -H "x-tenant: wondernails" https://[tu-dominio]/
# El tenant debe resolverse por path/subdomain, no por el header
```

### Prueba de upload sin auth

```bash
curl -X POST https://[tu-dominio]/api/upload \
  -F "file=@imagen.jpg"
# Esperado: {"error":"Unauthorized"} con status 401
```

---

## Evidencia requerida para cierre

El agente debe dejar en este archivo (sección de abajo) los resultados de:

1. Output de `npm run test:e2e:subset -- --grep "STRY-021"`
2. Output de `npm run build`
3. Captura de los 3 endpoints críticos devolviendo 404

---

## Resultados de evidencia (llenar por el agente)

### E2E test results (2026-05-28)

```
11 passed (3.9m)
✓ SEC-001: /api/diagnose/user-check devuelve 404
✓ SEC-001: /api/diagnose/user-check POST es rechazado
✓ SEC-002: /api/debug/auth-check devuelve 404
✓ SEC-002: Respuesta de 404 no filtra información interna
✓ SEC-008: POST /api/upload sin sesión es rechazado (401 o 403)
✓ SEC-007: POST /api/whatsapp/webhook sin firma → 401
✓ SEC-007: Verificación GET del webhook sigue funcionando
✓ Regresión: Landing de wondernails carga correctamente
✓ Regresión: Landing de centro-tenistico carga correctamente
✓ Regresión: Health endpoint responde OK
✓ PERF-002: 0 logs de TenantService en cliente
```

### Build output

```
Tasks: 1 successful (3m5s) — ƒ Proxy (Middleware) reconocido
TypeScript: 0 errores
Lint: 0 errores (28 warnings pre-existentes)
```

### Endpoints críticos (curl manual)

```
Health:  HTTP 200 ✓
SEC-001 (user-check GET):  HTTP 404 ✓
SEC-002 (auth-check GET):  HTTP 404 ✓
SEC-008 (upload POST sin auth): HTTP 403 ✓ (CSRF proxy bloquea antes del handler)
SEC-009 (diagnose/env): Sin DB URL preview, sin hostname — solo booleans ✓
```

---

## UUIDs de tenant registrados (llenar por el agente en Fase 2)

Ejecutar en Supabase: `SELECT id, slug FROM tenants ORDER BY slug;`

| slug             | UUID |
| ---------------- | ---- |
| centro-tenistico |      |
| delirios         |      |
| manada-juma      |      |
| wondernails      |      |
| zo-system        |      |

> Estos valores deben ir en `.env.local` como `TENANT_UUID_[SLUG_MAYUSCULAS]`
