# Common Agent Guards — Sass Store

## Aplicabilidad

Todas las correcciones e implementaciones en este repositorio deben respetar las siguientes reglas.

## Reglas Generales

1. **Result Pattern obligatorio**
   - Ningún `try/catch` en lógica de negocio. Usar `Result<T, DomainError>`.
   - Usar `withResultHandler()` en rutas API.
   - Errores tipados con `ErrorFactories`.

2. **Multitenancy**
   - Toda query filtra por `tenant_id`.
   - Sin excepciones para tablas tenant-aware.

3. **Tests por cada cambio funcional**
   - Al menos tests unitarios (`*.spec.ts`).
   - Si hay UI o flujo, E2E (`tests/e2e/*.spec.ts`).

4. **Sin secretos en código**
   - Usar variables de entorno.
   - Revisar `.gitignore` antes de crear archivos `.env*`.

5. **Documentación**
   - Si se crea/modifica una funcionalidad sustancial, actualizar docs existentes o crear nuevos en `docs/`.

## Aplicación

Estas reglas actúan como checklist en PR reviews y en el pipeline de QA.
