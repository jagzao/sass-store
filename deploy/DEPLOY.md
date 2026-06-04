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

**Plataforma oficial:** Vercel (`https://sass-store-web.vercel.app`)

Los workflows de Cloudflare Pages en `.github/workflows/deploy-prod.yml` son **legacy / no activos**.

#### Opción A — GitHub Actions (RECOMENDADO, automatizado)

**Workflow:** `.github/workflows/deploy-vercel.yml`

**Secrets necesarios en GitHub** (Settings → Secrets and variables → Actions):

| Secret              | Valor                              | Cómo obtener                                                            |
| ------------------- | ---------------------------------- | ----------------------------------------------------------------------- |
| `VERCEL_TOKEN`      | Token de API Vercel                | [vercel.com/account/tokens](https://vercel.com/account/tokens) → Create |
| `VERCEL_ORG_ID`     | `team_mQyHI45nTHLlechqrcICsxL7`    | Copiar de `.vercel/project.json`                                        |
| `VERCEL_PROJECT_ID` | `prj_SxXYPfxnt6McX409he7AUNgG8qqy` | Copiar de `.vercel/project.json`                                        |

**Trigger:** Push a `master` dispara deploy automático.

#### Opción B — Vercel Dashboard (manual, inmediato)

1. Ir a [vercel.com/dashboard](https://vercel.com/dashboard) → proyecto `sass-store-web`
2. Tab **Deployments** → buscar commit reciente
3. Si no aparece o está fallado → clic **Redeploy** del último deploy exitoso
4. Esperar 1-2 min

#### Opción C — Vercel CLI (requiere `vercel login`)

```bash
npx vercel --prod
```

> **Nota:** Si `vercel login` falla con error de certificado SSL (`unable to verify the first certificate`), usá la **Opción B** (dashboard web).

### 1.3 Post-deploy checklist

- [ ] Health check: `GET /api/health` → `{"status":"ok"}`
- [ ] Version check: `GET /api/version` → `{"version":"1.001",...}`
- [ ] Verificar versión en consola del navegador (F12 → Console) → `[Sass Store] v1.001`
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

### Vercel CLI falla con error SSL

```
Error: unable to verify the first certificate
```

- Causa: red corporativa, antivirus o proxy interceptando TLS
- Solución: usar **Opción B** (dashboard web) en lugar de CLI

---

## 6. Historial de deploys

| Versión | Fecha      | Commit    | Notas                                                | Estado producción   |
| ------- | ---------- | --------- | ---------------------------------------------------- | ------------------- |
| 1.001   | 2026-06-04 | `422293f` | Versión inicial: console.log en home + deploy memory | ✅ `/api/health` ok |
| 1.001+  | 2026-06-04 | `38e7ced` | Agrega `/api/version` endpoint                       | ❌ No deployado     |
| 1.001+  | 2026-06-04 | `930ecef` | Actualiza deploy/DEPLOY.md con troubleshooting       | ❌ No deployado     |

---

**Estado actual:** Build local ✅ | Push GitHub ✅ | Deploy producción ⏳ **pendiente**

_Última actualización: 2026-06-04_
_Último push a master: `930ecef` — deploy Vercel requiere trigger manual (dashboard) o configurar GitHub Actions_
