# STRY-CTV-pro-elite-book — Plan de ejecución

## Objetivo

Experiencia Pro-Elite para Centro Tenístico Villafuerte: header (login arcilla, navegación fina), flujo `/t/centro-tenistico/book` de una sola pantalla con glassmorphism, contraste AA sobre fondo oscuro, animación de entrada, y validación con UT + E2E + demo en video.

## Paleta fija

- Naranja arcilla: `#B85C38` (`CTV_CLAY_ORANGE` en `apps/web/lib/design/centro-tenistico-brand.ts`)
- Fondo reserva: `#07080C` (`CTV_BOOK_BG`)
- Texto crema títulos: `#FAF7F2` (`CTV_CREAM_TEXT`)

## Archivos tocados

- `apps/web/lib/design/centro-tenistico-brand.ts`
- `apps/web/lib/booking/book-date-format.ts`
- `apps/web/app/t/[tenant]/book/book-calendar-client.tsx`
- `apps/web/app/t/[tenant]/book/page.tsx`
- `apps/web/components/auth/UserMenu.tsx`
- `apps/web/components/ui/TenantNavigation.tsx`
- `apps/web/lib/db/seed-data.ts`, `apps/web/lib/design/tokens.ts`
- `apps/web/components/tenant/centro-tenistico/*`
- `tests/unit/book-date-format.spec.ts`, `tests/unit/centro-tenistico-brand.spec.ts`
- `tests/e2e/booking/centro-tenistico-public-book.spec.ts`
- `tests/e2e/demo/centro-tenistico-book-demo.spec.ts`

## Comandos de verificación

```bash
npm run test:unit -- --grep "getOrdinal|centro-tenistico-brand"
npm run build --workspace=@sass-store/web
npx playwright test tests/e2e/booking/centro-tenistico-public-book.spec.ts
npx playwright test tests/e2e/demo/centro-tenistico-book-demo.spec.ts --video=on
```

## Estado

Implementado en código; pendiente ejecutar E2E en CI/local con app levantada.
