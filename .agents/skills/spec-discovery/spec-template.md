# Spec — {Título corto del feature}

> **Estado:** Borrador | En revisión | Aprobada  
> **Alcance tenant:** {tipo de tenant o "todos"}  
> **Tenant piloto:** `{slug}`  
> **Creado:** {YYYY-MM-DD}  
> **Diferenciador vs otros tenants:** {1 línea si aplica}

---

## 1. Narrativa

**Como** {rol}, **quiero** {acción}, **para** {beneficio}.

### Contexto

{Por qué existe el feature; problema actual; convivencia con flujos existentes}

---

## 2. Diferenciador multitenancy

| Aspecto     | {Tenant A / default} | {Tenant B / variante} |
| ----------- | -------------------- | --------------------- |
| {Dimensión} | {Comportamiento}     | {Comportamiento}      |

**Convivencia:** {Qué no se migra / qué convive en MVP}

---

## 3. Criterios de aceptación (Gherkin)

### CA-1: {Happy path principal}

```gherkin
Dado que {precondición}
Cuando {acción}
Entonces {resultado}
```

### CA-2: {Happy path secundario}

```gherkin
...
```

### CA-3–N: {Validación, permisos, errores, multitenancy}

{Mínimo: 1 happy path, 1 validación, 1 error/sad path, 1 permisos o cross-tenant si aplica}

---

## 4. Happy path — matriz resumida

| ID    | Escenario   |
| ----- | ----------- |
| HP-01 | {escenario} |

---

## 5. Sad path — matriz resumida

| ID    | Escenario   | Resultado esperado |
| ----- | ----------- | ------------------ |
| SP-01 | {escenario} | {resultado}        |

---

## 6. Pantallas y rutas

| Pantalla | Ruta propuesta | Actor | Notas   |
| -------- | -------------- | ----- | ------- |
| {nombre} | `{ruta}`       | {rol} | {notas} |

---

## 7. Modelo de datos

### 7.1 Tablas nuevas o cambios

{SQL o descripción de entidades}

### 7.2 Invariantes de negocio

- {regla 1}
- {regla 2}

### 7.3 Índices sugeridos

{Si aplica}

---

## 8. API (Result Pattern)

Base: `{/api/...}`

| Método | Ruta     | Descripción | Auth  |
| ------ | -------- | ----------- | ----- |
| {GET}  | `{ruta}` | {desc}      | {rol} |

**Implementación obligatoria:** `withResultHandler()`, Zod, `DomainError` tipados.

### 8.1 Schemas Zod principales

```typescript
// {NombreSchema}
```

---

## 9. Notificaciones / integraciones (si aplica)

{Eventos, plantillas, reglas de encolado, idempotencia}

---

## 10. UI / UX

### 10.1 {Pantalla principal}

- {Comportamiento}
- `data-testid` en elementos clave

### 10.2 Terminología

{`getClientTerms(tenantSlug)` — términos por tenant}

---

## 11. Seguridad y RLS

- RLS por `tenant_id`
- Rate limits si hay endpoints públicos
- Sin filtración de stack en API

---

## 12. Futuro / fuera de MVP (datos only si aplica)

{Features explícitamente excluidos del MVP}

---

## 13. Fuera de MVP

| Item   | Notas   |
| ------ | ------- |
| {item} | {razón} |

---

## 14. Testing

### Unitarios

- {servicios a cubrir}
- `expectSuccess` / `expectFailure`

### E2E

- Tag/grep: `{tag}`
- Tenant: `{slug}`
- Credencial: `jagzao@gmail.com` / `admin`

---

## 15. Asunciones validadas

| #   | Asunción                        | Estado  |
| --- | ------------------------------- | ------- |
| 1   | {asunción funcional/no técnica} | ✅ / ⏳ |

---

## 16. Referencias de código existente

| Área   | Archivo  |
| ------ | -------- |
| {área} | `{path}` |

---

## 17. Definition of Done

- [ ] Migraciones DB + RLS
- [ ] APIs Result Pattern + tests unitarios
- [ ] UI según sección 10
- [ ] E2E grep/tag verde
- [ ] Documentación `.agents/sprint/` si deriva a User Story
