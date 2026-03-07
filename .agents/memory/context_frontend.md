# Contexto Frontend - sass-store

> **Referencia principal:** [SYSTEM_PROMPT.md](../SYSTEM_PROMPT.md)
> **Protocolos relacionados:** [validation.md](../protocols/validation.md) | [testing.md](../protocols/testing.md)

---

## Reglas de oro (obligatorias)

### Arquitectura UI (monolith web)

- Mantener rutas y pantallas en `apps/web/app/**` (Next.js App Router).
- Componentes reutilizables en `apps/web/components/**`.
- No mover logica de dominio al cliente; mantenerla en `apps/web/lib/**` y API routes.

### Contratos y tipos

- Evitar `any` en props, hooks y respuestas de API.
- Tipar requests/responses con DTOs compartidos cuando aplique.
- Normalizar fechas y estados para evitar branching inconsistente en UI.

### Integracion con API

- Tratar cada llamada como operacion con success/failure explicita.
- Manejar errores de forma tipada y mostrar mensajes sanitizados para usuario.
- No exponer detalles internos de backend en toasts, modales ni logs de cliente.

### Multitenancy en frontend

- Toda navegacion tenantizada debe preservar contexto (`/t/[tenant]/...`).
- No cachear datos tenant-scoped en llaves globales sin `tenant`.
- Al cambiar tenant, invalidar estado derivado y caches dependientes.

### Accesibilidad y calidad visual

- Inputs y botones con `label`, foco visible y estados `disabled/loading/error`.
- Asegurar navegacion por teclado en formularios y modales.
- Evitar layout shift fuerte en carga (skeletons, placeholders estables).

---

## Convenciones de implementacion

- Componentes: PascalCase (`BookingCard.tsx`).
- Hooks: prefijo `use` (`useTenantBookings.ts`).
- Helpers de UI: camelCase en modulos pequenos.
- `data-testid` en elementos clave para pruebas E2E.

---

## Checklist rapido por pantalla nueva

- [ ] Ruta en `apps/web/app/**` sigue estructura tenant cuando aplica.
- [ ] Estados principales cubiertos: loading, empty, success, error.
- [ ] Errores mostrados al usuario son claros y sanitizados.
- [ ] Acciones criticas tienen confirmacion o guardrails.
- [ ] Componentes tienen `data-testid` para flujos E2E criticos.
- [ ] Tests unitarios o de integracion para logica UI no trivial.
- [ ] Test E2E del flujo principal (si hay impacto de negocio).

---

## Comandos utiles

- `npm run dev`
- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run test:e2e:subset -- --grep "nombre-pantalla"`
