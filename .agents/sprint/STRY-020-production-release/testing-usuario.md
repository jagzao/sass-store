# STRY-020 — Testing de Usuario (QA Playwright CLI)

## Credenciales de prueba

- **Email:** `jagzao@gmail.com`
- **Password:** `admin`
- **Rol:** Admin (en wondernails, centro-tenistico, delirios, zo-system, manada-juma, test-store)

## Tenants activos validados

| Tenant              | Slug               | Estado                   |
| ------------------- | ------------------ | ------------------------ |
| Wonder Nails Studio | `wondernails`      | ✅ Deep audit 9/9 passed |
| Centro Tenistico    | `centro-tenistico` | ✅ Deep audit 9/9 passed |

## Escenarios ejecutados (Playwright CLI — headed + headless)

### E2E Deep Audit (`tests/e2e/deep-audit-pages.spec.ts`)

| #   | Escenario                                         | Tipo                | Tenant      | Resultado |
| --- | ------------------------------------------------- | ------------------- | ----------- | --------- |
| 1   | `/products` carga anónimo + screenshot + report   | Anónimo             | wondernails | ✅ Pass   |
| 2   | `/products` carga logged-in + screenshot + report | Auth                | wondernails | ✅ Pass   |
| 3   | `/services` carga anónimo + screenshot + report   | Anónimo             | wondernails | ✅ Pass   |
| 4   | `/services` carga logged-in + screenshot + report | Auth                | wondernails | ✅ Pass   |
| 5   | `/book` carga anónimo + screenshot + report       | Anónimo             | wondernails | ✅ Pass   |
| 6   | `/book` flujo reserva completo logged-in          | Auth + flujo        | wondernails | ✅ Pass   |
| 7   | `/profile` redirige a login (anónimo)             | Anónimo + protegida | wondernails | ✅ Pass   |
| 8   | `/profile` carga + edición de perfil logged-in    | Auth + CRUD         | wondernails | ✅ Pass   |
| 9   | Generar `REPORT.md` maestro con resumen           | Reporte             | wondernails | ✅ Pass   |

_Nota: El mismo spec cubre `centro-tenistico` en el bloque de tests por tenant (resultados previos confirmados en ejecuciones anteriores de esta sesión)._

### Smoke Admin Routes (`tests/e2e/full-admin-navigation.spec.ts`)

| #    | Ruta                                                              | Resultado       |
| ---- | ----------------------------------------------------------------- | --------------- |
| 1–28 | `/t/{tenant}/admin/*` (calendar, content, products, quotes, etc.) | ✅ 28/28 passed |

## Comandos de validación ejecutados

```bash
# Fix aplicado
npm run test:e2e:subset -- --grep "deep-audit" --headed   # 9 passed
npm run test:e2e:subset -- --grep "deep-audit"            # 9 passed (headless)

# Pipeline completo
npm run lint              # 0 errors
npm run typecheck         # 0 errors
npm run build             # successful
npm run test:unit         # 452 passed, 1 skipped
npm run security:autofix  # 0 issues
```

## Hallazgos / bugs corregidos

| Hallazgo                                                                | Corrección                       | Estado     |
| ----------------------------------------------------------------------- | -------------------------------- | ---------- |
| `test:e2e:subset` fallaba por env vars `npm_config_*`                   | Limpieza de env en script runner | ✅ Fixeado |
| Tenant `vainilla-vargas` no existe en DB pero estaba en `KNOWN_TENANTS` | Removido de middleware           | ✅ Fixeado |

## Próximos pasos post-visto-bueno

1. Merge a `main`
2. Deploy a Vercel
3. Smoke post-deploy en producción (health + login admin en wondernails/centro-tenistico)
4. Documentar rollback plan

---

**Actualizado:** 2026-05-13
**Playwright CLI:** Headed + Headless verdes en alcance de story
