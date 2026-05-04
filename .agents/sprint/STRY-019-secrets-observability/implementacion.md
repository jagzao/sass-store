# Implementación — STRY-019

## Criterios de aceptación

| CA   | Descripción     | Implementación                               | Tests UT | Tests E2E   |
| ---- | --------------- | -------------------------------------------- | -------- | ----------- |
| CA-1 | Secrets rotados | Manual dueño + registro en implementacion.md | —        | —           |
| CA-2 | Scripts basura  | Fix/eliminar `remove-console-logs.ts`        | —        | —           |
| CA-3 | Build strict    | `ignoreBuildErrors: false`                   | —        | Build verde |
| CA-4 | Timeout Vercel  | `vercel.json` con rangos                     | —        | —           |
| CA-5 | Error tracking  | Sentry init                                  | —        | Smoke       |
| CA-6 | Middleware plan | Documento ADR o migración                    | —        | —           |

## Implementación final

- [ ] Auditoría secrets completada
- [ ] Rotación ejecutada por dueño (verificada)
- [ ] Scripts basura limpios
- [ ] tsc 0 errores
- [ ] Build sin ignoreBuildErrors
- [ ] Health operativo
- [ ] Sentry configurado
- [ ] **Visto bueno dueño** antes de `done`

## Evidencia de validación

| Paso    | Comando                                   | Resultado esperado          |
| ------- | ----------------------------------------- | --------------------------- |
| Secrets | Dashboards actualizados + `vercel env ls` | Variables nuevas            |
| Scripts | `tsc --noEmit`                            | 0 errores                   |
| Build   | `npm run build`                           | Pasar sin ignoreBuildErrors |
| Sentry  | `npm run dev` + forzar error              | Evento en Sentry dashboard  |
