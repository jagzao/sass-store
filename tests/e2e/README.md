# E2E Tests - Playwright

Tests end-to-end modernos y limpios para Sass Store.

## Estructura

```
tests/e2e/
├── README.md           # Este archivo
├── fixtures/           # Fixtures y helpers reutilizables
├── auth.setup.ts       # Setup de autenticación (proyecto dependency)
└── *.spec.ts           # Tests organizados por feature
```

## Ejecutar tests

```bash
# Todos los tests
npm run test:e2e

# Solo Chrome
npm run test:e2e:chromium

# Con interfaz visual
npm run test:e2e:ui

# Modo debug
npm run test:e2e:debug

# Ver último reporte
npm run test:e2e:report
```

## Escribir tests

### Test básico

```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test("should do something", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading")).toBeVisible();
  });
});
```

### Con autenticación

```typescript
import { test, expect } from "./fixtures/auth.fixture";

test.describe("Protected Feature", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test("should access protected page", async ({ page }) => {
    await page.goto("/dashboard");
    // Usuario ya está autenticado
  });
});
```

## Mejores prácticas

1. **Usar selectores semánticos**: `getByRole`, `getByLabel`, `getByText`
2. **Evitar selectores CSS frágiles**: No usar `.class-name` o `#id`
3. **Tests independientes**: Cada test debe poder ejecutarse solo
4. **Datos de prueba**: Limpiar después de cada test
5. **Esperas automáticas**: Playwright espera automáticamente, no usar `sleep()`

## Organización sugerida

```
tests/e2e/
├── auth/
│   ├── login.spec.ts
│   └── register.spec.ts
├── products/
│   ├── list.spec.ts
│   └── details.spec.ts
├── cart/
│   └── checkout.spec.ts
└── admin/
    └── dashboard.spec.ts
```

## Configuración

Ver `playwright.config.ts` en la raíz del proyecto.

- **Base URL**: http://localhost:3001
- **Navegadores**: Chrome, Firefox, Safari, Mobile
- **Reintentos**: 2 en CI, 0 en local
- **Videos**: Solo en fallos
- **Screenshots**: Solo en fallos
