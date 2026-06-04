# Memoria de Deploy — Sass Store

> **Archivo de conocimiento operativo para deploys.**
> **Versión actual:** `1.001`
> **Último deploy:** `2026-06-04`

---

## 1. Pipeline de Deploy

### 1.1 Pre-deploy checklist

- [ ] `npm run build` — sin errores
- [ ] `npm run lint` — 0 errores (warnings pre-existentes aceptables)
- [ ] `npm run typecheck` — sin errores
- [ ] `npm run test:unit` — sin regresiones
- [ ] E2E subset acordado — verde (`npm run test:e2e:subset -- --grep "tag"`)
- [ ] Verificar que `deploy/VERSION` refleja el nuevo número
- [ ] Actualizar `deploy/DEPLOY.md` → sección **Último deploy**

### 1.2 Proceso de deploy (Git → Vercel)

```bash
# 1. Commit con version bump
# 2. Push a master/main
# 3. Vercel auto-deploy (si Git integration está activa)
#    o manual: npx vercel --prod
#    o GitHub Actions: ver .github/workflows/deploy-prod.yml
```

**Nota importante:** Este proyecto tiene dos pipelines de deploy configurados:

- **Vercel:** `https://sass-store-web.vercel.app` (desde Git push o `vercel --prod`)
- **Cloudflare Pages:** `https://sassstore.com` (desde GitHub Actions)

Verificar en qué plataforma está activo el deploy actual antes de proceder.

### Estado actual del deploy (último push)

- **Commit en `master`:** `930ecef`
- **Push a GitHub:** ✅ Completado
- **Vercel auto-deploy:** ❌ No detectado (endpoint `/api/version` devuelve 404)
- **Cloudflare Pages:** ❓ Estado desconocido (requiere verificar en dashboard)

### Troubleshooting — deploy no se activa

| Síntoma                                         | Causa probable                           | Solución                                                                                              |
| ----------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Push a `master` no dispara deploy               | Git integration desactivada en Vercel    | Ir a Vercel dashboard → project → Settings → Git → verificar que `master` está en "Production Branch" |
| `npx vercel --prod` falla con "token not valid" | CLI no autenticado                       | Ejecutar `npx vercel login` (requiere navegador) o usar `VERCEL_TOKEN` env var                        |
| `/api/version` 404 en producción                | Build anterior aún sirviendo (cache CDN) | Esperar 2-5 min tras deploy, o forzar redeploy en Vercel dashboard                                    |

### 1.3 Post-deploy checklist

- [ ] Health check: `GET /api/health` → `{"status":"ok"}`
- [ ] Verificar versión en consola del navegador (F12 → Console)
- [ ] Smoke test: login + home + navegación crítica
- [ ] Validar que la fecha de deploy en `deploy/DEPLOY.md` coincide

---

## 2. Versionado de la aplicación

### Convención

- **Formato:** `MAJOR.MINOR` (ej. `1.001`, `1.002`, `1.010`, `2.000`)
- **Incremento:** `+0.001` por cada deploy/actualización
- **Hardcoded en:**
  - `deploy/VERSION`
  - `apps/web/lib/version.ts`

### Cómo bump de versión

1. Editar `deploy/VERSION` → nuevo número (ej. `1.002`)
2. Editar `apps/web/lib/version.ts` → `APP_VERSION = "1.002"`
3. Editar `deploy/DEPLOY.md` → **Versión actual** y **Último deploy**
4. Commit: `chore(deploy): bump version 1.001 → 1.002`
5. Push → deploy

---

## 3. Consola del navegador (versión visible)

- Al cargar cualquier home de tenant (`/t/{tenant}`), se emite:
  ```
  [Sass Store] v1.001 — deploy: 2026-06-04
  ```
- Fuente: `apps/web/components/home/HomeRouter.tsx`

---

## 4. Entornos

| Entorno    | URL                                      | Branch           | Trigger                           |
| ---------- | ---------------------------------------- | ---------------- | --------------------------------- |
| Producción | `https://sass-store-web.vercel.app`      | `master`         | Push a `master` o `vercel --prod` |
| Preview    | `https://{branch}-sass-store.vercel.app` | cualquier branch | Push a branch                     |
| Local dev  | `http://localhost:3003`                  | local            | `npm run dev`                     |

---

## 5. Troubleshooting

### Deploy no refleja cambios

- Verificar que `deploy/VERSION` y `apps/web/lib/version.ts` estén sincronizados
- Forzar hard-refresh del navegador (Ctrl+F5)
- Revisar Vercel dashboard → Deployments → buscar el commit correcto

### Build falla en Vercel pero local pasa

- Revisar `vercel.json` (timeouts, memoria)
- Verificar env vars en Vercel dashboard vs `.env.local`
- Limpiar cache de build: `vercel --prod --force`

---

## 6. Historial de deploys

| Versión | Fecha      | Commit    | Notas                                                | Estado producción                  |
| ------- | ---------- | --------- | ---------------------------------------------------- | ---------------------------------- |
| 1.001   | 2026-06-04 | `422293f` | Versión inicial: console.log en home + deploy memory | ✅ `/api/health` ok                |
| 1.001+  | 2026-06-04 | `38e7ced` | Agrega `/api/version` endpoint                       | ❌ No deployado aún (endpoint 404) |
| 1.001+  | 2026-06-04 | `930ecef` | Actualiza deploy/DEPLOY.md con troubleshooting       | ❌ No deployado aún                |

---

**Estado actual:** Build local ✅ | Push GitHub ✅ | Deploy producción ⏳ **pendiente** (requiere trigger manual en Vercel dashboard o `vercel --prod`)

_Última actualización: 2026-06-04_
_Último push a master: `38e7ced` — deploy Vercel en curso o requiere trigger manual_
