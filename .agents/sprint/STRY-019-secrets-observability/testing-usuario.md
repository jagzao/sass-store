# Pasos de prueba — STRY-019 (agente / manual + Playwright)

**Grep E2E:** `STRY-019|health|error-boundary`.

## Precondiciones

- [ ] Acceso a dashboards: Cloudinary, Google Cloud, Upstash, Supabase (para rotación manual dueño)
- [ ] Nuevo `NEXTAUTH_SECRET` generado (openssl rand -base64 32)

## Escenarios

### Escenario A — Secrets rotados (dueño ejecuta)

| Paso | Acción (dueño)                                    | Verificación (agente)                            |
| ---- | ------------------------------------------------- | ------------------------------------------------ |
| A1   | Cloudinary dashboard → rotate API secret          | `CLOUDINARY_API_SECRET` actualizada en Vercel    |
| A2   | Google Cloud Console → rotate OAuth client secret | `GOOGLE_CLIENT_SECRET` actualizada               |
| A3   | Upstash dashboard → rotate REST token             | `UPSTASH_REDIS_REST_TOKEN` actualizada           |
| A4   | Generar nuevo `NEXTAUTH_SECRET`                   | `vercel env add NEXTAUTH_SECRET` con valor nuevo |

### Escenario B — Build strict

| Paso | Acción                                             | Resultado esperado     |
| ---- | -------------------------------------------------- | ---------------------- |
| B1   | Quitar `ignoreBuildErrors: true` en next.config.js | Build inmediato limpio |
| B2   | `npm run build`                                    | 0 errores              |

### Escenario C — Error tracking

| Paso | Acción                       | Resultado esperado                 |
| ---- | ---------------------------- | ---------------------------------- |
| C1   | Forzar error en desarrollo   | Evento aparece en Sentry dashboard |
| C2   | Verificar contexto de tenant | Datos de tenant presentes en tags  |

---

- [ ] **Checklist secrets:** al menos 4 tokens rotados
- [ ] **tsc limpio** verificado
- [ ] **Build** strict verificado
- [ ] **Sentry** smoke test OK
- [ ] Solo entonces: mensaje al dueño "lista para visto bueno"
