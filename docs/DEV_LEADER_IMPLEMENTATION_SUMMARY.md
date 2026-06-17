# Dev Leader Implementation Summary - Sass Store

> Última actualización: 2026-04-27 | Estado: VIGENTE | Dueño: Dev Leader / Developer Agent
> Estándares de código, procesos de PR, calidad mínima y cobertura esperada. Todo desarrollador debe leer esto antes de escribir código nuevo.

---

## 1. Misión del Dev Leader

Garantizar que el código entregado sea:

- **Mantenible:** convenciones consistentes, sin duplicación, documentado cuando es complejo.
- **Seguro:** sin fugas de datos entre tenants, sin `any`, sin excepciones no controladas.
- **Testeable:** con Result Pattern, funciones puras donde sea posible, separación UI/lógica.
- **Performante:** respetando presupuestos de bundle, LCP, INP y CLS.

---

## 2. Estándares de Código (No Negociables)

### Lenguaje y Formato

- **TypeScript strict** — sin `any`, sin `@ts-ignore` sin justificación y comentario.
- **Indentación:** 2 espacios.
- **Comas finales:** siempre (`trailingComma: "all"` en Prettier).
- **Formateo automático:** ejecutar `npx prettier --write` antes de cada commit.
- **Longitud máxima de línea:** 120 caracteres (configurable en `.prettierrc`).

### Naming Conventions

| Elemento | Convención | Ejemplo |
| -------- | ---------- | ------- |
| Componente React | PascalCase | `ProductCard.tsx`, `BookingCalendar.tsx` |
| Hook personalizado | camelCase + prefijo `use` | `useRoleManagement.ts`, `useTenantData.ts` |
| Helpers/utilidades | camelCase | `formatCurrency.ts`, `validateDateRange.ts` |
| Constantes | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `DEFAULT_TIMEZONE` |
| Tipos/Interfaces | PascalCase + prefijo descriptivo | `ProductDTO`, `CreateBookingCommand` |
| Archivos de ruta API | kebab-case | `route.ts`, `[id]/route.ts` |
| Tests | `.spec.ts` para Vitest, `.spec.ts` para Playwright | `ProductService.spec.ts`, `checkout-flow.spec.ts` |

### Estructura de Archivos Obligatoria

```
apps/web/
├── app/
│   ├── api/                 # Solo handlers HTTP; sin lógica de negocio
│   │   └── [domain]/
│   │       └── route.ts
│   ├── (routes)/            # Pages / layouts del App Router
│   └── layout.tsx / page.tsx
├── components/              # Componentes React reutilizables (PascalCase)
├── lib/
│   ├── server/              # Servicios con acceso a DB (Result<T, DomainError>)
│   ├── services/            # Lógica de negocio pura (Result<T, DomainError>)
│   ├── db/                  # Acceso a datos (legacy — migrando a server/)
│   ├── auth/                # Helpers de autenticación
│   ├── hooks/               # Custom React hooks (useXxx)
│   ├── security/            # Guards, rate limiting, sanitización
│   └── utils/               # Funciones puras (fecha, string, number)
├── public/                  # Assets estáticos (logos, imágenes fallback)
└── middleware.ts            # Resolución de tenant (deprecado → ver ADR)

packages/
├── core/                    # Result Pattern, middleware, errores tipados
├── database/                # Drizzle schema, conexión, RLS helpers
├── validation/              # Zod schemas con integración Result
├── config/                  # Configs compartidas (auth, env)
├── ui/                      # Primitives UI (Button, Input, Modal)
└── cache/                   # Redis helpers
```

---

## 3. Patrones Obligatorios

### Result Pattern (OBLIGATORIO desde 2025-Q4)

```typescript
// Core imports obligatorios
import { Result, Ok, Err, match, fromPromise } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import { validateWithZod } from "@sass-store/validation/src/zod-result";

// Servicio: siempre retorna Promise<Result<T, DomainError>>
export const getProduct = (id: string): Promise<Result<Product, DomainError>> => {
  return fromPromise(
    db.products.findUnique({ where: { id } }),
    (error) => ErrorFactories.database("find_product", `Failed to find product ${id}`, undefined, error),
  );
};

// Handler de API: siempre envuelto con withResultHandler
export const GET = withResultHandler(
  async (request): Promise<Result<Product, DomainError>> => {
    return await getProduct(id).flatMap(validateProduct).flatMap(checkPermissions);
  },
);

// Branching: usar match() en lugar de if/else anidados
export const getProductOrDefault = (id: string) =>
  match(await getProduct(id), {
    ok: (product) => product,
    err: () => DEFAULT_PRODUCT,
  });
```

### Reglas de Multitenancy (OBLIGATORIO)

1. **Toda query a DB debe filtrar por `tenant_id`** o depender de RLS activa.
2. **Nunca usar `tenant_id` hardcodeado** en lógica de negocio.
3. **Validar que el usuario autenticado pertenece al tenant** antes de operaciones destructivas.
4. **Los fixtures de tests deben incluir `tenantSlug`** en `data-testid` o URL.

### Reglas de Hooks React

```typescript
// ❌ NO: lógica de negocio en hooks
const useProducts = () => {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts); // try/catch implícito
  }, []);
  return products;
};

// ✅ SÍ: hooks delegan a servicios con Result Pattern
const useProducts = () => {
  const [data, setData] = useState<Result<Product[], DomainError>>(Ok([]));
  useEffect(() => {
    loadProducts().then(setData);
  }, []);
  return data;
};
```

---

## 4. Proceso de Pull Request

### Comandos Obligatorios Antes de Crear PR

```bash
# 1. Formateo
npx prettier --write "apps/**/*.{ts,tsx}" "packages/**/*.{ts,tsx}" "tests/**/*.{ts,tsx}"

# 2. Lint
npm run lint

# 3. Typecheck
npm run typecheck

# 4. Build
npm run build

# 5. Tests unitarios con cobertura
npm run test:unit

# 6. Tests de integración (si aplica al módulo modificado)
npm run test:integration

# 7. Tests E2E de subset (si el feature tiene flujo de usuario)
npm run test:e2e:subset -- --grep "[nombre-feature]"
```

### Checklist de PR (Template obligatorio `.github/pull_request_template.md`)

- [ ] Título sigue Conventional Commits (`feat(auth): add OAuth2 flow with Result pattern`)
- [ ] Descripción incluye tipo, severidad, scope y riesgos
- [ ] Se adjuntan screenshots si hay cambios UI
- [ ] Se menciona el comando de test ejecutado
- [ ] Se actualiza `AGENTS.md` si cambia un patrón
- [ ] Se actualiza el documento de Summary correspondiente (`DEV_LEADER`, `QA_LEADER`, `ARCHITECT`) si aplica
- [ ] No hay `console.log` de debugging (solo structured logging permitido)
- [ ] No se envían secrets en código (usar `.env.local`)
- [ ] Nunca push directo a `main` — solo via PR

### Revisión de Código (Code Review)

Cada PR requiere mínimo **1 aprobación** del Dev Leader o un arquitecto. Se revisa:

1. **Result Pattern compliance:** ¿Hay try/catch nuevo en lógica de negocio? ❌ Bloquear.
2. **Tenant isolation:** ¿Todas las queries tienen `tenant_id`? ❌ Bloquear.
3. **Tests:** ¿Hay tests unitarios + E2E para el cambio? ❌ Bloquear.
4. **Type safety:** ¿Hay `any` o `@ts-ignore` sin explicación? ❌ Bloquear.
5. **Performance:** ¿Se agregó polling innecesario o carga de datos masiva sin paginación? ⚠️ Comentar.

---

## 5. Cobertura y Calidad Esperada

### Targets por Nivel

| Nivel | Target | Actual (2026-04-27) | Gap |
| ----- | ------ | --------------------- | --- |
| Cobertura de líneas (unit) | ≥80% | ~45% (faltan Retouch, Social, otros) | -35% |
| Cobertura funcional crítica | 100% | ~80% (POS ✅, Booking ✅, Retouch ✅, Inventory ✅) | -20% |
| Tests E2E por tenant | ≥1 per tenant | ✅ 7 tenants cubiertos | 0% |
| Tests sin skip/todo | 100% | ~90% (quedan skips justificados en Finance Matrix) | -10% |

### Métricas de Bundle y Performance

| Métrica | Budget | Acción si se excede |
| ------- | ------ | -------------------- |
| Bundle JS (cliente) | < 250KB | Revisar importaciones y code-splitting |
| Build time (CI) | < 5 min | Cachear dependencias, paralelizar jobs |
| LCP (P75) | < 2.5s | Optimizar imágenes, usar lazy loading |
| INP (P75) | < 200ms | Reducir JS principal, usar `React.memo` |
| CLS | < 0.1 | Reservar espacio para imágenes/fonts |

---

## 6. Deuda Técnica de Desarrollo (Plan de Mitigación)

| # | Deuda | Impacto | Owner Dev | Plan | ETA |
|---|-------|---------|-----------|------|-----|
| 1 | POS API sin Result Pattern (legacy try/catch) | Incosistencia en respuestas API, bugs ocultos | Dev Leader | ✅ **Resuelto**: migrado a `POSService` con Result Pattern + `withResultHandler()` | 2026-04-27 |
| 2 | `try/catch` legacy en `lib/db/**` y hooks | Riesgo de excepciones no controladas | Dev Leader | Refactor por touched-files + críticos | 3 sprints |
| 2 | `console.error` sin structured logging | Difícil debug en producción | Dev Leader | Migrar a `logResult()` + contexto tenant | Sprint actual |
| 3 | Duplicación de lógica de auth entre hooks y server | Mantenimiento doble | Dev Leader | Centralizar en `@sass-store/core/auth` | 2 sprints |
| 4 | Polling innecesario en session/cart | Carga de servidor + latencia | Dev Leader | Revisar `staleTime` y caching de React Query | Sprint actual |
| 5 | Middleware deprecated de Next.js | Warning en build / riesgo de break | Dev Leader | Migrar a `proxy` o `_proxy` | Sprint actual |

---

## 7. Comandos de Desarrollo Diarios

```bash
# Iniciar entorno local (construye todas las apps + packages)
npm run dev           # http://localhost:3001

# Generar Drizzle schema types y migraciones
npm run db:generate
npm run db:push
npm run db:seed       # Sembrar datos de desarrollo

# Ejecutar tests rápidos durante desarrollo
npx vitest --run tests/unit/services/CartService.spec.ts
npx vitest --watch tests/unit/services/

# Ejecutar E2E interactivo (headed)
npx playwright test tests/e2e/cart/ --headed

# Seguridad y rendimiento
npm run security:autofix
npm run lint
npm run typecheck
```

---

## 8. Onboarding de Nuevos Desarrolladores

Pasos obligatorios para todo nuevo dev:

1. Leer `AGENTS.md` (Result Pattern, convenciones, workflows).
2. Leer `DEV_LEADER_IMPLEMENTATION_SUMMARY.md` (este documento).
3. Leer `ARCHITECT_IMPLEMENTATION_SUMMARY.md` (stack, ADRs).
4. Revisar `tests/unit/result-pattern.spec.ts` como ejemplo de testing con Result.
5. Configurar Prettier + ESLint en su IDE (`format on save`).
6. Ejecutar `npm run dev` y verificar que `http://localhost:3001` responde.
7. Ejecutar `npm run test:unit` y confirmar que pasa.
8. Primer PR: un fix trivial para validar que conoce el flujo completo.

---

**🚨 Este documento es el contrato de calidad del equipo. Ignorar estos estándares resultará en rechazo de PRs. Sin excepciones.**
