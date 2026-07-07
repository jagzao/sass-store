import * as Sentry from "@sentry/nextjs";

/**
 * STRY-026 — enriquece los eventos de Sentry con contexto por tenant.
 * Resuelve el tenant desde la URL (/t/{slug}) para etiquetar cada error.
 */
function resolveTenantFromUrl(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const m = window.location.pathname.match(/^\/t\/([^/]+)/);
  return m ? m[1] : undefined;
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  environment: process.env.NODE_ENV,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  beforeSend(event) {
    const tenant = resolveTenantFromUrl();
    if (tenant) {
      event.tags = { ...event.tags, tenant };
    }
    return event;
  },
});
