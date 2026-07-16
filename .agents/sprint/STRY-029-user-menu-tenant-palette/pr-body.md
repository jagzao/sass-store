## Story
STRY-029 — Menú de usuario adaptado a la paleta del tenant

## Cambios
- `apps/web/components/auth/UserMenu.tsx`: reemplaza colores hardcodeados del menú desplegable por paleta del tenant resuelta por slug. Fondo, texto, iconos, hover, active, divider y logout ahora derivan del tenant activo.
- `apps/web/lib/tenant/tenant-provider.tsx`: inyecta tokens CSS de tema (`--color-background`, `--color-foreground`, `--color-muted-foreground`, `--color-border`, `--color-muted`, `--color-ring`, `--color-error`) para componentes que sí están bajo `TenantProvider`.
- `tests/e2e/tenant/user-menu-theme.spec.ts`: suite E2E que cubre SC-01 a SC-05 en wondernails, centro-tenistico y zo-system, validando colores del tema, contraste hover/active y responsive.

## Scenarios cubiertos
| ID | Scenario | Tipo de test | Archivo | Estado |
|---|---|---|---|---|
| SC-01 | Menú en tenant con paleta clara | E2E | `tests/e2e/tenant/user-menu-theme.spec.ts` | ✅ |
| SC-02 | Menú en tenant con paleta oscura | E2E | `tests/e2e/tenant/user-menu-theme.spec.ts` | ✅ |
| SC-03 | Tenant sin paleta personalizada (fallback) | E2E | `tests/e2e/tenant/user-menu-theme.spec.ts` | ✅ |
| SC-04 | Estados hover/active mantienen contraste | E2E | `tests/e2e/tenant/user-menu-theme.spec.ts` | ✅ |
| SC-05 | Menú responsive conserva paleta | E2E | `tests/e2e/tenant/user-menu-theme.spec.ts` | ✅ |

## Validaciones
| Validación       | Resultado | Notas |
|------------------|-----------|-------|
| prettier         | ✅        | Archivos del feature |
| lint             | ✅        | 0 errores (28 warnings preexistentes) |
| typecheck        | ✅        | `npm run typecheck` OK |
| build            | ⚠️        | Falla por errores preexistentes en módulos legales (`legalDocuments`, `legalConsents`, `dataPrivacyRequests` no exportados de `@sass-store/database/schema`). No relacionado con UserMenu. |
| test:unit        | ✅        | 534 passed |
| test:integration | N/A       | Sin cambios de backend |
| test:security    | N/A       | Sin cambios de seguridad |
| E2E feature      | ✅        | 9/9 passed |
| smoke regression | N/A       | No se ejecutó suite completa por build roto preexistente |

## Test plan
- [ ] Revisar PR diff
- [ ] Confirmar visualmente en wondernails y centro-tenistico
- [ ] Resolver build preexistente de módulos legales antes de mergear

🤖 Generado con /quality-runner por Claude Code
