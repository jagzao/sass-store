# Contexto Compartido - DTOs y Modelos

## Reglas base de contratos

- DTOs de entrada/salida en TypeScript estricto; evitar `any`.
- Nombres en `camelCase` para API y codigo app.
- IDs de entidades como `string` (UUID) salvo casos explicitos.
- Fechas en formato ISO-8601 (`toISOString`) para transporte.
- En recursos tenant-scoped, `tenantId` es obligatorio en capa de dominio.

## Validacion y errores

- Validar DTOs con Zod + Result (`validateWithZod`).
- No lanzar errores genericos desde validacion; retornar `ValidationError`.
- Errores de dominio solo con `DomainError` y `ErrorFactories`.
- Mensajes hacia cliente deben ser claros y sin detalles internos.

## Compatibilidad y versionado

- Evitar breaking changes silenciosos en DTOs publicos.
- Si un campo cambia semantica, agregar campo nuevo y deprecacion gradual.
- Documentar cambios de contrato en PR y notas tecnicas relacionadas.

## Mapping DB <-> DTO

- `packages/database/schema.ts` es la fuente de verdad de estructura persistida.
- No exponer columnas internas sensibles en responses (tokens, secrets, metadata cruda).
- Mapear enums/estados de DB a unions o literales controlados en DTO.
- Normalizar nullables para que el cliente reciba formas predecibles.

## Patrones de pruebas para contratos

- Probar payload valido minimo, payload valido completo y payload invalido.
- Cubrir campos de borde: vacio, maximo, formato incorrecto y tipo incorrecto.
- Probar incompatibilidad de tenant cuando el DTO incluye referencias cruzadas.
