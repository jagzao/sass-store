# Pasos de prueba — STRY-020 (agente + dueño)

**Grep E2E:** `STRY-020|smoke|health` (post-deploy, contra URL producción).

---

## Pre-condiciones

- [ ] STRY-017, 018 y 019 cerrados con visto bueno
- [ ] URL de producción Vercel conocida (obtener de dashboard)
- [ ] Credencial: `jagzao@gmail.com` / `admin` — debe existir en DB de producción

---

## Escenario A — Quality gate local (agente, pre-merge)

| Paso | Acción                                  | Resultado esperado       |
| ---- | --------------------------------------- | ------------------------ |
| A1   | `npm run lint`                          | 0 errors                 |
| A2   | `npx tsc --noEmit --incremental false`  | 0 errors                 |
| A3   | `npm run build` (sin ignoreBuildErrors) | Compilación exitosa      |
| A4   | `npm run test:unit`                     | ≥445/446 passed          |
| A5   | `npx playwright test`                   | ≥88% passed (≤20 failed) |

---

## Escenario B — Smoke post-deploy producción (agente)

| Paso | Acción                               | Resultado esperado                       |
| ---- | ------------------------------------ | ---------------------------------------- |
| B1   | `GET [PROD_URL]/api/health`          | 200, `{"status":"ok","timestamp":"..."}` |
| B2   | `GET [PROD_URL]/t/wondernails/`      | 200, HTML landing                        |
| B3   | `GET [PROD_URL]/t/centro-tenistico/` | 200, HTML landing                        |
| B4   | `GET [PROD_URL]/`                    | 200, zo-system landing                   |
| B5   | `GET [PROD_URL]/t/wondernails/login` | 200, formulario login visible            |

---

## Escenario C — Login manual en producción (👤 dueño)

| Paso | Acción                                     | Resultado esperado                  |
| ---- | ------------------------------------------ | ----------------------------------- |
| C1   | Navegar a `[PROD_URL]/t/wondernails/login` | Página de login carga               |
| C2   | Ingresar `jagzao@gmail.com` / `admin`      | Redirige al dashboard del tenant    |
| C3   | Navegar a `/t/wondernails/pos`             | POS carga sin error 500             |
| C4   | Navegar a `/t/centro-tenistico/`           | Landing carga con estilos correctos |

---

## Escenario D — Vercel CI/CD verificación

| Paso | Acción                                   | Resultado esperado                 |
| ---- | ---------------------------------------- | ---------------------------------- |
| D1   | Ver Vercel dashboard → último deployment | Status: Ready (no Error)           |
| D2   | Ver build logs Vercel                    | Sin errores de TypeScript ni build |
| D3   | Ver GitHub Actions → último push master  | E2E gate: ✅ passed                |

---

## Rollback (si smoke falla)

Si Escenario B o C falla tras deploy:

1. Ir a Vercel dashboard → Deployments → seleccionar deployment anterior
2. Clic en "Redeploy" (rollback instantáneo a versión anterior)
3. Verificar que el problema es en el deploy actual (no en datos de producción)
4. Reportar al dueño con screenshot del error

---

## Checklist final (agente — antes de notificar al dueño)

- [ ] Escenario A completo y verde
- [ ] Escenario B completo y verde
- [ ] Vercel deployment status: Ready
- [ ] Solo entonces: mensaje al dueño "listo para visto bueno — smoke prod OK, quality gate verde, deploy exitoso"
