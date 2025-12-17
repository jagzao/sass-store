# E2E Tests - Guía Completa

## 🚀 Configuración Inicial

### 1. Ejecutar Setup Automático

```bash
npm run test:e2e:setup
```

Este script verifica:

- ✅ Navegadores de Playwright instalados
- ✅ Archivo `.env.test` configurado
- ✅ Variables de entorno requeridas
- ✅ `.gitignore` configurado correctamente

### 2. Configurar Credenciales de Test

Edita `.env.test` con credenciales de tu base de datos de test:

```env
# ⚠️ IMPORTANTE: Usa una BD separada para tests!
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/sass_store_test"

TEST_ADMIN_EMAIL="admin@wondernails.com"
TEST_ADMIN_PASSWORD="Password123!"
TEST_TENANT_SLUG="wondernails"
```

## 📋 Scripts Disponibles

### Ejecutar Tests

```bash
# Ejecutar todos los tests E2E (headless)
npm run test:e2e

# Ejecutar con UI interactiva (recomendado para desarrollo)
npm run test:e2e:ui

# Ejecutar con navegador visible
npm run test:e2e:headed

# Ejecutar con debugger
npm run test:e2e:debug
```

### Ejecutar Tests Específicos

```bash
# Solo smoke tests
npx playwright test tests/e2e/example.spec.ts

# Solo tests de servicios
npx playwright test tests/e2e/admin/services.spec.ts

# Un test específico por nombre
npx playwright test -g "should create a new service"
```

## 🎯 Features Implementadas

### 1. **Form Persistence (localStorage)**

Los formularios guardan automáticamente:

- ✅ Auto-save con debounce (500ms)
- ✅ Restauración automática al reabrir
- ✅ Indicador visual "Borrador guardado"
- ✅ Botón "Limpiar" para eliminar borrador
- ✅ TTL de 24h (limpieza automática)

**Test:** `tests/e2e/admin/services.spec.ts` - "should validate form persistence"

### 2. **Helpers Reutilizables**

Ubicación: `tests/e2e/helpers/test-helpers.ts`

```typescript
// Login como admin
await loginAsAdmin(page);

// Navegar a servicios
await navigateToAdminServices(page);

// Crear servicio
await createService(page, {
  name: "Mi Servicio",
  price: "50.00",
  duration: "45",
});

// Generar nombre único para tests
const name = generateTestName("Service");

// Manejar diálogos (alert/confirm)
setupDialogHandler(page, "accept");
```

### 3. **Performance Optimizada**

- ✅ Solo Chromium por defecto (otros navegadores opcionales)
- ✅ Workers en paralelo (50% CPUs)
- ✅ Timeouts inteligentes (no arbitrarios)
- ✅ Reutilización de servidor en dev
- ✅ Screenshots/videos solo en fallos

### 4. **Seguridad**

- ✅ Credenciales en `.env.test` (no hardcodeadas)
- ✅ `.env.test` en `.gitignore`
- ✅ BD de test separada
- ✅ No expone credenciales en logs

## 📂 Estructura de Tests

```
tests/e2e/
├── README.md                    # Esta guía
├── helpers/
│   └── test-helpers.ts          # Funciones reutilizables
├── admin/
│   └── services.spec.ts         # CRUD de servicios
├── auth/
│   └── full-auth.spec.ts        # Tests de autenticación
├── customers/
│   └── customer-workflow.spec.ts # Flujo de clientes
└── example.spec.ts              # Smoke tests básicos
```

## 🔧 Configuración Avanzada

### Timeout Personalizado

```typescript
test("mi test largo", async ({ page }) => {
  test.setTimeout(60000); // 60 segundos
  // ... tu código
});
```

### Ejecutar en Múltiples Navegadores

Edita `playwright.config.ts` y descomenta:

```typescript
projects: [
  { name: "chromium", use: devices["Desktop Chrome"] },
  { name: "firefox", use: devices["Desktop Firefox"] },  // Descomentar
  { name: "webkit", use: devices["Desktop Safari"] },    // Descomentar
],
```

## 🐛 Debugging

### Ver Tests en Slow Motion

```bash
npx playwright test --headed --slow-mo=1000
```

### Generar Trace para Análisis

```bash
npx playwright test --trace on
npx playwright show-trace trace.zip
```

### Ver Screenshots de Fallos

Los screenshots se guardan en: `test-results/`

## ⚠️ Consideraciones Importantes

### 1. Base de Datos de Test

**NUNCA uses la BD de producción**. Los tests pueden:

- Crear datos de prueba
- Modificar registros
- Eliminar datos

### 2. Dev Server

Los tests esperan que el dev server esté en `http://localhost:3001`.
Playwright lo inicia automáticamente.

### 3. Limpieza de Datos

Los tests crean y eliminan datos automáticamente, pero si fallan
pueden dejar datos residuales. Usa BD de test limpia regularmente.

## 📊 Performance Esperado

En una máquina moderna:

- **Smoke tests:** ~20 segundos
- **Service CRUD:** ~60 segundos
- **Suite completa:** ~2-3 minutos

## 🆘 Troubleshooting

### Error: "Browsers not installed"

```bash
npx playwright install chromium
```

### Error: ".env.test not found"

```bash
npm run test:e2e:setup
```

### Error: "Cannot connect to database"

Verifica que `TEST_DATABASE_URL` en `.env.test` sea correcto.

---

**Última actualización:** 2025-12-17
