# Playwright Test Report Action Plan

**Date:** 2026-02-24
**Report Source:** `http://localhost:9323/`

## Context & Findings

Based on the Playwright Test Report analysis, the current primary blocker in the E2E suite (specifically inside `tests/e2e/customers/customer-workflow.spec.ts`) is that the application gets stuck trying to create a new client. 

**Error Observed:**
- **Test:** `Customer & Visit Workflow › should create client, add 3 visits, and edit a visit`
- **Failure:** `Error: Not on customer details page.`
- **Root Cause Analysis:** The test fails because after submitting the "Agregar Nueva Clienta" form, the frontend CTA remains frozen in a **"Guardando..."** state. As a result, the application never redirects to the client details page (`/clientes/[id]`).

This is a critical blocker. Because the test cannot even create a client, it completely bypasses the sections of the test designed to interact with the "Crear visita/AddEditVisitModal" functionality.

## Core Issues
1. **API/Backend Disconnection:** The frontend form submission is hanging. This usually means the API endpoint for creating a customer is either:
   - Returning a 500 Internal Server Error.
   - Throwing a CORS error or connection refused (e.g., if the `apps/api` server on port 4000 is not running or fully implemented).
   - Failing silently without returning an error that the frontend can catch to remove the loading state.

## Remediation Plan

### Phase 1: Unblock Customer Creation (P0)

1. **Verify API Connectivity**
   - Ensure that the backend service handling the `POST /api/tenants/[tenant]/customers` (or equivalent) endpoint is actively running.
   - Check the terminal logs of the `web` and `api` instances when a customer creation is triggered to catch the exact exception.

2. **Implement/Fix Customer Creation Endpoint**
   - Since the `apps/api` package was recently scaffolded, verify if the customer creation route actually exists and is mapped correctly in the new architecture. 

3. **Frontend Error Handling Resilience**
   - Update the frontend form `onSubmit` handler in `Nueva Clienta` to ensure that if the API fetch fails or times out, the `submitting` state is set back to `false` and an error toast/message is shown. This prevents the "Guardando..." infinite hang.

### Phase 2: Resume E2E Testing for AddEditVisitModal (P1)

Once the customer is successfully created and the frontend redirects to the customer details page:
1. Run the targeted E2E tests:
   ```bash
   npx playwright test tests/e2e/customers/customer-workflow.spec.ts
   npx playwright test tests/e2e/customers/product-visits.spec.ts
   ```
2. **Mobile Layout Verification:** Since the initial bug involved the `Subtotal` and `Total Estimado` en la versión móvil, asegurarse que se están validando con simuladores móviles como `--project='Mobile Chrome'`.

## Next Steps
- Implementar manejo de errores real en el `onSubmit` del formulario nueva clienta.
- Evaluar los logs del backend durante la creación de clientes.
