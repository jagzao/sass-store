# Testing Usuario � STRY-017 Rendimiento

## Precondiciones

- npm run dev en puerto 3001
- BD seed con tenants: wondernails, centro-tenistico
- Login: jagzao@gmail.com / admin

## Escenarios por tenant

### E1: Landing tenant ISR

- Visitar /t/wondernails
- Sin 404, metadata SEO correcta
- Recarga m�s r�pida (cach�)

### E2: Products p�blicos

- /t/wondernails/products
- Paginaci�n visible si aplica

### E3: Quotes admin

- /t/wondernails/admin/quotes
- Lista carga =50 items

### E4: Customer visits

- Cliente ? ver visitas
- Lista carga =50 items

### E5: Bookings calendar

- /t/wondernails/admin/calendar
- Crear reserva <3s

### E6: Multitenant

- Repetir E1 en centro-tenistico
- Sin datos cruzados

## Regresi�n

- npm run test:e2e:subset -- --grep "wondernails|centro-tenistico"
- Headed primero, luego headless
