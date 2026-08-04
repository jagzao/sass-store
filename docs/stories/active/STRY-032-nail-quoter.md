# STRY-032 — Cotizador de uñas para tenants nail-salon

**Estado**: spec lista para implementacion.
**Tenant piloto**: wondernails.
**Artifacts**: `plan.md`, `review-pre-impl.md`, `routing.md`.

## Resumen funcional

Reemplazar el boton "Nueva Visita" por "Cotizar Uñas" en tenants nail-salon (Wondernails). El cotizador permite seleccionar material, largo, forma y adornos; calcula precio/duracion estimados; muestra resumen; y desde ahi envia cotizacion por WhatsApp (crea quote) o reserva cita (crea booking + anticipo + mensaje de confirmacion). Para otros tenants, "Nueva Visita" conserva el modal actual con Historial Medico & Medidas colapsado por defecto.

## AC Gherkin (16 scenarios)

- SC-01: boton "Cotizar Uñas" en tenant nail-salon.
- SC-02: boton "Nueva Visita" para otros tenants.
- SC-03: abrir cotizador sin cliente seleccionado (selector o telefono nuevo).
- SC-04: seleccion de material/largo/forma actualiza estimado.
- SC-05: agregar adornos actualiza estimado.
- SC-06: quitar adorno reduce estimado.
- SC-07: expandir/contraer resumen.
- SC-08: enviar cotizacion por WhatsApp con cliente existente.
- SC-09: enviar cotizacion con telefono de cliente nuevo.
- SC-10: reservar cita desde cotizador con anticipo.
- SC-11: mensaje de confirmacion de cita.
- SC-12: validacion de opciones obligatorias.
- SC-13: validacion de cliente/telefono.
- SC-14: doble submit bloqueado.
- SC-15: sesion expirada al reservar.
- SC-16: API rechaza opciones de otro tenant.

## Decisiones tecnicas clave

- Flag `nail_salon` en `tenant_configs`.
- Tablas nuevas: `nail_quote_options`, `customer_quotes`, `quote_lines`, `booking_deposits`.
- Funcion pura `calculateNailQuote` en `packages/core` con Result Pattern.
- API routes con `withResultHandler` y Zod; RLS en todas las tablas.
- WhatsApp encolado con `idempotency_key`; booking creado en transaccion.
- `AddEditVisitModal` recibe prop `defaultCollapsed`.

## Routing

- Implementacion: Nivel 3 OpenCode+Z.ai.
- QA en vivo / Security: Nivel 5 Claude.
- Testing: Nivel 2/3 segun AC.

## Proximo paso

Ejecutar `/deliver` o `/auto-implement` usando esta spec.
