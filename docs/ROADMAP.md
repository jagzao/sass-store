# Roadmap — Sass Store

## Visión

Plataforma multitenant SaaS para negocios de belleza y bienestar (salones, centros deportivos, tiendas), con catálogo estilo Amazon, reservas, POS, planner social y analítica.

---

## Fases

### Fase 1 — MVP Core (Completado)

- [x] Multitenancy con domain/URL slug (`t/{tenant}`)
- [x] Productos y servicios con variantes
- [x] Carrito, checkout y pasarela de pagos (Mercado Pago)
- [x] Autenticación NextAuth (Google + email/password)
- [x] Roles (Admin, Gerente, Personal, Cliente)
- [x] Panel administrativo básico
- [x] Diseño per-tenant (branding, colores, logos)

### Fase 2 — Cierre de Calidad y Producción (Actual — S2)

- [x] POS robusto con flujo de caja y cierre de turno (STRY-001)
- [ ] Quality OS compliance y dashboard interno (STRY-022)
- [ ] Recuperación E2E y CI Gate (STRY-018)
- [ ] Higiene de secretos y observabilidad (STRY-019)
- [ ] Rendimiento + seguridad estructural (STRY-017)
- [ ] Go-Live hardening (STRY-020)

### Fase 3 — Expansión de Features (Backlog)

- [ ] Retouch system (STRY-002)
- [ ] Inventory auto-deduction (STRY-003)
- [ ] Health Panel operativo (STRY-004)
- [ ] Reportes PDF/Excel (STRY-005)
- [ ] Notificaciones push/WhatsApp (STRY-006)
- [ ] Sistema de reseñas/calificaciones (STRY-007)
- [ ] Loyalty / puntos por compra (STRY-008)

### Fase 4 — Escalabilidad Avanzada (Future)

- [ ] Google Calendar 2-way sync (STRY-009)
- [ ] Analytics avanzado por tenant (STRY-010)
- [ ] Onboarding wizard (STRY-011)
- [ ] Multi-sucursal (STRY-012)
- [ ] App móvil nativa (STRY-013)
- [ ] Marketplace de templates (STRY-014)
- [ ] AI suggestions social media (STRY-015)
- [ ] Traducción multi-idioma (STRY-016)

---

## Dependencias Técnicas

| Tecnología         | Versión       | Uso                 |
| ------------------ | ------------- | ------------------- |
| Next.js            | ^16.0.10      | App Router, RSC     |
| React              | ^19.2.3       | UI                  |
| TypeScript         | ^5.2.2        | Tipado estricto     |
| Drizzle ORM        | ^0.45.1       | Postgres (Supabase) |
| NextAuth (Auth.js) | 5.0.0-beta.30 | Auth                |
| TailwindCSS        | ^4.1.14       | Estilos             |
| Vitest             | ^4.0.18       | Unit tests          |
| Playwright         | ^1.40.0       | E2E tests           |

---

_Actualizado: 2026-05-31 — Fase 2 en curso con Quality OS (STRY-022)._
