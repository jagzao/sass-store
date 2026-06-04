# Testing Usuario - STRY-017 Rendimiento

## Precondiciones

- Servidor levantado en puerto 3003 (dev)
- BD seed con tenants: wondernails, centro-tenistico, delirios, manada-juma, zo-system
- Login: jagzao@gmail.com / admin

## Escenarios validados

### E1: Landing tenant ISR

- [x] Visitar /t/wondernails - carga OK, sin 404
- [x] Visitar /t/centro-tenistico - carga OK
- [x] Metadata SEO correcta en ambos
- [x] Recarga mas rapida por ISR (revalidate=60)

### E2: Products publicos

- [x] /t/wondernails/products - carga con paginacion por defecto (limit=24)
- [x] /t/centro-tenistico/products - sin datos cruzados

### E3: Quotes admin

- [x] /t/wondernails/admin/quotes - lista carga con maximo 50 items por defecto
- [x] Sin degradacion lineal en listas grandes

### E4: Customer visits

- [x] Cliente - ver visitas - lista limitada a 50 por defecto

### E5: Bookings calendar

- [x] /t/wondernails/admin/calendar - carga OK
- [x] Crear reserva - validaciones en paralelo (Promise.all)

### E6: CacheManager

- [x] InvalidatePattern funciona para prefijos de cache
- [x] TTLs ajustados: TENANT 7200s, PRODUCT/SERVICE 1800s

### E7: Multitenant regresion

- [x] Smoke crawl paso para wondernails, centro-tenistico, delirios, manada-juma, zo-system
- [x] 0 404 inesperados en paginas publicas
- [x] Admin rutas redirigen 302 para anon (esperado)

## Metricas de rendimiento

| Metrica                | Valor          | Notas                        |
| ---------------------- | -------------- | ---------------------------- |
| Build time             | ~220s          | Next.js 16.1.1 Turbopack     |
| Unit tests             | 487/487        | 35 archivos, 12.56s          |
| E2E smoke (headed)     | 69/69 pasan    | 2.1m, 0 regresiones visuales |
| E2E smoke (headless)   | 69/69 pasan    | 2.8m, 0 fallos funcionales   |
| API latency products   | ~320ms (warm)  | limit=24, dev server         |
| API latency services   | ~1711ms (cold) | limit=50, dev server         |
| ISR revalidate         | 60s            | Tenant layout + landing page |
| Pool max               | 3              | Remoto (antes 1)             |
| Tenant cache L1        | 60s            | Map en proceso               |
| Tenant cache L2        | 7200s          | CacheManager                 |
| API pagination default | 24-50          | Productos 24, resto 50       |

## Comandos de validacion

```bash
# Unit tests
npx vitest run tests/unit

# E2E smoke headless (dev server en 3003)
$env:BASE_URL="http://localhost:3003"
$env:E2E_REUSE_SERVER="1"
npx playwright test tests/e2e/smoke-anon-crawl.spec.ts --reporter=line

# Build
npm run build
```

## Estado

- Implementacion: completa (commits 3bb457f, fca6540)
- Testing agente: completo
  - Lint: 0 errores, 26 warnings preexistentes
  - Typecheck: 0 errores
  - Build: exitoso
  - Unit tests: 487/487
  - E2E headed: 69/69
  - E2E headless: 69/69
- Pendiente: visto bueno dueno de producto (DoD punto 7)
