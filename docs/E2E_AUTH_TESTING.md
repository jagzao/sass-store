# E2E Auth & Admin Testing Guide

## Overview

This document describes the end-to-end authentication and admin navigation test strategy for the sass-store platform.

---

## Test Architecture

### Test Files

| File                                                     | Scope                                          | Tags                                                 |
| -------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| `tests/e2e/auth/auth-admin-comprehensive.spec.ts`        | Login flow, admin nav, cross-profile switching | `@LOGIN`, `@DASHBOARD`, `@NAV`, `@PROFILE`, `@SMOKE` |
| `tests/e2e/booking/multi-tenant-public-book.spec.ts`     | Public booking — 3 active tenants              | `@BOOK-*`                                            |
| `tests/e2e/booking/centro-tenistico-public-book.spec.ts` | CTV booking flow with mocked API               | `@CTV-BOOK`                                          |
| `tests/e2e/booking/booking-full-flow.spec.ts`            | Admin calendar (requires login)                | —                                                    |
| `tests/e2e/auth/auth-smoke.spec.ts`                      | Fast regression: auth API, protected routes    | —                                                    |

### Helper Functions (`tests/e2e/helpers/test-helpers.ts`)

```typescript
// Login to any tenant with explicit credentials
loginAs(page, tenantSlug, email, password);

// Login with default TEST_CREDENTIALS (wondernails admin)
loginAsAdmin(page);

// Sign out via NextAuth endpoint
signOut(page);
```

---

## Auth Strategy in Tests

The dev server saturates with >4 consecutive credential-based logins. To avoid this:

- **Bloque 1** (Login flow): each test is independent (1-2 logins total)
- **Bloques 2 & 3** (Dashboard + Nav): `beforeAll` calls `createAuthSession()` once, saves cookies. Each test restores them via `page.context().addCookies(cookies)` — no new login requests.
- **Bloque 4** (Cross-profile): explicit login + logout to verify session lifecycle (2 logins)
- **Bloque 5** (Smoke): no login needed

```typescript
// Pattern used in dashboard/nav tests:
let authCookies: any[] = [];
test.beforeAll(async ({ browser }) => {
  authCookies = await createAuthSession(browser); // ONE login
});
test.beforeEach(async ({ page }) => {
  await page.context().addCookies(authCookies); // restore without login
  await page.goto(`${BASE}/t/${tenant}`);
});
```

## Login Form — Selectors

The `LoginForm` component (`apps/web/components/auth/LoginForm.tsx`) exposes:

| Element        | Selector                                | Notes                                                   |
| -------------- | --------------------------------------- | ------------------------------------------------------- |
| Email field    | `getByTestId("email-input").first()`    | `.first()` required — login page has a hidden duplicate |
| Password field | `getByTestId("password-input").first()` | Same — use `.first()`                                   |
| Submit button  | `getByTestId("login-btn").first()`      | Text: "Iniciar Sesión"                                  |
| Error message  | `getByTestId("error-message")`          | Only visible on failed login                            |

> **Why `.first()`?** The login page includes a registration form below the fold with the same `data-testid`. Playwright strict mode rejects ambiguous selectors — `.first()` targets the visible login form.

---

## Login Flow

```
1. navigate → /t/{tenant}/login
2. fill    → data-testid="email-input"
3. fill    → data-testid="password-input"
4. click   → data-testid="login-btn"
5. wait    → URL leaves /login
6. assert  → data-testid="hometenant-dashboard" visible
```

After successful login, `router.push('/t/${tenantSlug}')` runs and `HomeRouter`
shows:

- **Admin / Gerente / Personal** → `data-testid="hometenant-dashboard"` (HomeTenant component)
- **Cliente / unauthenticated** → `data-testid="public-home"`

---

## Dashboard Structure (HomeTenant)

After admin login at `/t/{tenant}`:

```
DashboardLayoutWrapper
├── HomeTenantHeader
│   ├── Mobile hamburger (data-testid="mobile-menu-trigger")
│   ├── MonthlyAppointmentsBadge (calendar link with count)
│   └── User avatar initial
├── main
│   ├── Fila 1: TodayAppointmentsSection + PendingAppointmentsSection
│   ├── Fila 2: CustomersList
│   └── Fila 3: BusinessNavGrid (🏪 NEGOCIO)
│       ├── 📅 Calendario de citas → /admin/calendar
│       ├── 👥 Clientas → /clientes
│       ├── 💰 Finanzas → /finance
│       ├── 📱 Planificación Redes → /social
│       ├── 💬 Atención al Cliente → /contact
│       └── 🎨 Plantillas Canva → canva.com (external)
└── HomeTenantBottomNav (mobile, data-testid="bottom-nav")
    └── Inicio | Citas | Agenda | Clientas | Más
```

---

## Protected Admin Routes

These routes require `Admin` or `Gerente` role. Unauthenticated users are redirected to `/t/{tenant}/login?callbackUrl=...`.

| Route                        | Layout Guard                | Access         |
| ---------------------------- | --------------------------- | -------------- |
| `/t/{tenant}/admin/*`        | `admin/layout.tsx`          | Admin, Gerente |
| `/t/{tenant}/admin_bookings` | `admin_bookings/layout.tsx` | Admin, Gerente |
| `/t/{tenant}/finance/*`      | `finance/layout.tsx`        | Admin, Gerente |
| `/t/{tenant}/inventory`      | `inventory/layout.tsx`      | Admin, Gerente |
| `/t/{tenant}/clientes/*`     | `clientes/layout.tsx`       | Admin, Gerente |

Public routes (no auth required): `/book`, `/products`, `/services`, `/cart`, `/checkout`, `/contact`

---

## Cross-Profile Switching

There is no built-in tenant switcher UI. To switch profiles:

1. **Sign out** — navigate to `/api/auth/signout` (or use `signOut()` helper)
2. **Navigate** to the new tenant's login page: `/t/{newTenant}/login`
3. **Login** with the appropriate credentials

The same user (`jagzao@gmail.com`) can be Admin on multiple tenants if a `userRoles` entry exists for each tenant.

**Security note:** The middleware validates tenant consistency on each request. A session from `wondernails` will be redirected if it tries to access `vigistudio` admin routes.

---

## Test Credentials

Configured via environment variables (defaults in `test-helpers.ts`):

```bash
TEST_TENANT_SLUG=wondernails          # default tenant for admin tests
TEST_ADMIN_EMAIL=jagzao@gmail.com     # admin user email
TEST_ADMIN_PASSWORD=admin             # admin user password
```

Override per-run:

```bash
TEST_ADMIN_PASSWORD=realpassword npx playwright test ...
```

---

## Running Tests

### All auth tests (headless, fast):

```bash
E2E_REUSE_SERVER=1 BASE_URL=http://localhost:3003 \
  npx playwright test tests/e2e/auth/ --reporter=list
```

### Comprehensive auth+nav (headed, visual):

```bash
E2E_REUSE_SERVER=1 BASE_URL=http://localhost:3003 \
  npx playwright test tests/e2e/auth/auth-admin-comprehensive.spec.ts \
  --headed --reporter=list
```

### By tag (filter specific scenarios):

```bash
# Only login flow
npx playwright test -g "@LOGIN"

# Only navigation
npx playwright test -g "@NAV"

# Only cross-profile
npx playwright test -g "@PROFILE"

# Full booking suite
npx playwright test tests/e2e/booking/
```

### Full validation pipeline:

```bash
npm run test:e2e
```

---

## Known Issues & Workarounds

| Issue                                                     | Root Cause                                              | Workaround                                           |
| --------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------- |
| Login page has 2 `email-input` elements                   | Registration form below fold shares testid              | Use `.first()` on all login form selectors           |
| `loginAsAdmin` occasionally times out on 2nd+ call in dev | Server compiles pages on first hit (~30–60s cold start) | `loginAs()` has 60s timeout; tests wrap in try-catch |
| Console errors "Failed to fetch" in admin                 | Fetch requests abort when navigating away               | Expected behavior, not a bug                         |
| CalendarTimeline hydration warning                        | `@dnd-kit/core` in React 19 strict mode                 | Dev-only warning, doesn't affect production          |

---

## Tenants Status

| Tenant             | Mode    | Booking        | Admin | Notes                        |
| ------------------ | ------- | -------------- | ----- | ---------------------------- |
| `wondernails`      | booking | ✅             | ✅    | Primary test tenant          |
| `vigistudio`       | booking | ✅             | ✅    | Secondary profile test       |
| `centro-tenistico` | booking | ✅             | ✅    | Custom CTV UI                |
| `delirios`         | catalog | ⚠️ no services | ✅    | Shows "Agenda no disponible" |
| `nom-nom`          | catalog | ⚠️ no services | ✅    | Same as delirios             |
| `zo-system`        | catalog | —              | ✅    | Platform landing / fallback  |
