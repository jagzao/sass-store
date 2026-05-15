# STRY-CTV-pro-elite-book — Testing

## Automatizado

| Paso                | Comando                                                                            |
| ------------------- | ---------------------------------------------------------------------------------- |
| UT                  | `npm run test:unit` (incluye `book-date-format`, `centro-tenistico-brand`)         |
| E2E reserva pública | `npx playwright test tests/e2e/booking/centro-tenistico-public-book.spec.ts`       |
| Demo video          | `npx playwright test tests/e2e/demo/centro-tenistico-book-demo.spec.ts --video=on` |
| Build               | `npm run build --workspace=@sass-store/web`                                        |

## Manual rápido (CTV)

1. Abrir `/t/centro-tenistico` — login "Iniciar Sesión" debe ser naranja arcilla `#B85C38`, texto blanco.
2. Navegación desktop: enlaces con tipografía fina (light / tracking).
3. Abrir `/t/centro-tenistico/book` — fondo oscuro, panel glass, títulos serif crema, carrusel de días, chips de hora, resumen sobre "Book Now".
4. Móvil (375px): mismo flujo en una columna, carrusel horizontal de días con scroll.
5. Contraste: títulos legibles sobre glass; botón arcilla con texto oscuro en resumen inferior.

## Precondición datos

Tenant con al menos un servicio activo (seed). Si hoy no hay horarios, el carrusel debe permitir otro día.
