# Testing usuario — STRY-026

> Pasos reproducibles que el **agente / QA automatizado** ejecuta (no el PO manual).
> Fuente de verdad para escribir/mantener Playwright CLI (`npm run test:e2e:subset --grep STRY-026`).
> **Credencial:** `jagzao@gmail.com` / `admin` en cada slug.

---

## Entorno y precondiciones

- App levantada: `npm run dev` (puerto 3001) o build + `npm run start`.
- `DATABASE_URL` = Supabase prod (tras Tramo A1). Confirmar con: ir a `/api/debug/ping` → 200.
- Tenants activos a probar: **wondernails**, **centro-tenistico**, **manada-juma**.
- Navegador: Chromium (Playwright) + Chrome/Edge real para validar "Instalar app".
- VAPID keys generadas y en `.env` (para push).

---

## Escenarios por tenant (repetir en cada slug)

### E1 — Login y acceso a admin_services

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | Ir a `/t/{slug}/login` | Formulario de login |
| 2 | `jagzao@gmail.com` / `admin` | Redirect al panel del tenant |
| 3 | Ir a `/t/{slug}/admin_services` | Lista de servicios carga sin error de red/consola |

**Resultado esperado:** sin errores en consola, sin 500 de `/api/tenants/{slug}/services`.

---

### E2 — Guardar servicio nuevo (CA-4)

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | Click "+ Nuevo Servicio" | Modal abre con form vacío |
| 2 | Nombre "Test PWA", precio 50, duración 1.5, descripción corta "Prueba", descripción larga "Detalle prueba" | Campos aceptan |
| 3 | Click "Crear Servicio" | Alert "Servicio creado exitosamente" |
| 4 | Modal cierra, lista recarga | "Test PWA" aparece |
| 5 | Consultar Supabase (psql / dashboard) | Registro existe en `services` con `short_description` y `long_description` |

**Fallo conocido a NO reproducir:** antes del fix, la descripción no se guardaba o apuntaba a DB equivocada.

---

### E3 — Editar servicio conserva descripción (CA-4, el bug de "descripción errónea")

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | Crear servicio vía SmartPublishWizard con shortDescription "Manicura AI" | Servicio creado |
| 2 | Abrir `/t/{slug}/admin_services` | Lista lo muestra |
| 3 | Click Editar (lápiz) | Form abre |
| 4 | Campo descripción | Muestra "Manicura AI" (no vacío ni texto viejo) |
| 5 | Cambiar precio a 99, Guardar | "Actualizado exitosamente" |
| 6 | Reabrir Editar | Precio 99, descripción "Manicura AI" intacta |

**Este es el caso que estaba roto:** SmartPublish escribía shortDescription pero admin solo leía description.

---

### E4 — Buscar servicio sin error (CA-5)

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | En admin_services con ≥1 servicio | Tabla visible |
| 2 | Escribir "ma" (2 chars) | Sin filtro (todos visibles) |
| 3 | Escribir "manicura" (≥3 chars) | Tabla filtra por nombre/descripción |
| 4 | Inspeccionar consola | Sin errores JS, sin 500 de red |

---

### E5 — PWA instalable (CA-1)

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | `GET /t/{slug}/manifest.webmanifest` | JSON válido, `display: standalone`, `theme_color`, íconos 192 y 512 |
| 2 | Abrir `/t/{slug}` en Chrome desktop | Ícono "Instalar" en barra |
| 3 | Abrir Lighthouse → PWA | "Installable" ✅ |
| 4 | Instalar | App abre standalone con logo/nombre del tenant |

**Por tenant:** el `theme_color` y los íconos deben corresponder al tenant (wondernails ≠ vigistudio).

---

### E6 — Service worker offline (CA-2)

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | Visitar `/t/{slug}` con red | SW registra (Application → Service Workers: activated) |
| 2 | DevTools → Network → Offline | — |
| 3 | Recargar | Página o fallback offline (no "dinosaurio") |
| 4 | Volver Online | Recarga normal |

---

### E7 — Push subscription (CA-2)

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | Botón "Activar notificaciones" visible | Permite solicitar permiso |
| 2 | Aceptar permiso | SW `pushManager.subscribe` con VAPID public key |
| 3 | POST `/api/tenants/{slug}/push/subscribe` | 201, registro en `push_subscriptions` |
| 4 | "Desactivar" | DELETE/POST unsubscribe → registro removido |

---

### E8 — Observabilidad (CA-6)

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | `grep -r "TSGmf_3G" .` | Sin coincidencias (credencial eliminada) |
| 2 | `SUPABASE_CREDENTIALS_GUIDE.md` | No existe |
| 3 | Provocar error 500 controlado | Llega a Sentry con `tag.tenant = {slug}` |
| 4 | Respuesta al cliente | ProblemDetails, sin stack trace |

---

## Barrera (§ 1.3) — orden de ejecución del agente

1. Playwright **headed** sobre E1–E7 por tenant → detectar fallos visuales/UX → fix.
2. Re-ejecutar hasta verde en **wondernails, centro-tenistico, manada-juma**.
3. Playwright **headless** `--grep STRY-026` en regresión.
4. `npm run test:unit` verde.
5. build / lint / typecheck verde.
6. Avisar al dueño con evidencia (comandos + resumen por tenant) → **visto bueno**.

---

## Pendiente del dueño (bloqueantes para cerrar C3 y rotación)

- [ ] Pegar logs/URLs de Sentry o Vercel para análisis de errores reales (E8 ampliado).
- [ ] Rotar password de Supabase en el dashboard y actualizar `apps/web/.env.local` + Vercel.
