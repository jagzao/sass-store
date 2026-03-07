# Debug Logs - sass-store

> **Referencia:** [SYSTEM_PROMPT.md](../SYSTEM_PROMPT.md#13-registro-de-aprendizaje)  
> **Protocolo:** Registrar [Error → Causa Raíz → Solución → Prevención] para cada incidente resuelto.

---

## Índice de Errores

| Fecha | Error | Categoría | Severidad |
|-------|-------|-----------|-----------|
| 2025-12-30 | RLS inseguras en campaigns | #seguridad | CRÍTICA |
| 2025-10-17 | Drizzle Kit no encontraba schema | #infra | ALTA |
| 2025-10-17 | ERR_CONNECTION_REFUSED | #infra | ALTA |

---

## Historial Detallado

### 2025-12-30 - Políticas RLS inseguras en `campaigns`

| Campo | Descripción |
|-------|-------------|
| **Error** | Políticas con acceso amplio sin aislamiento por tenant en tabla `campaigns` |
| **Causa Raíz** | Faltaba enforcement consistente de `tenant_id` en policies. Las políticas usaban `true` en lugar de verificar el tenant del usuario autenticado |
| **Solución** | 1. Eliminar políticas existentes inseguras<br>2. Crear nuevas políticas con verificación de `tenant_id`<br>3. Habilitar RLS en la tabla<br>4. Ejecutar pruebas con JWT de tenants diferentes |
| **Prevención** | - Checklist de RLS para nuevas tablas<br>- Tests de aislamiento obligatorios<br>- Review de seguridad en PRs que tocan DB |
| **Referencia** | `PASOS_CORRECCION_RLS_CAMPAIGNS.md` |
| **Comando Validación** | `npm run test:security -- --grep "campaigns"` |
| **Tiempo Debug** | ~2 horas |

**SQL de corrección aplicado:**
```sql
-- Eliminar políticas inseguras
DROP POLICY IF EXISTS "campaigns_policy" ON campaigns;

-- Crear políticas seguras
CREATE POLICY "campaigns_select" ON campaigns
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant')::text);

CREATE POLICY "campaigns_insert" ON campaigns
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant')::text);

-- Habilitar RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
```

---

### 2025-10-17 - Drizzle Kit no encontraba schema

| Campo | Descripción |
|-------|-------------|
| **Error** | `No schema files found for path config` al ejecutar `db:generate` o `db:push` |
| **Causa Raíz** | Configuración legacy en `drizzle.config.ts` usando propiedades deprecadas (`driver`, `connectionString`) y rutas antiguas que no coincidían con la estructura actual del proyecto |
| **Solución** | Migrar configuración a sintaxis actual:<br>- Cambiar `driver` por `dialect: postgresql`<br>- Cambiar `connectionString` por `dbCredentials.url`<br>- Actualizar ruta del schema a ubicación válida |
| **Prevención** | - Mantener documentación de configuración actualizada<br>- Verificar cambios en Drizzle Kit release notes |
| **Referencia** | `DRIZZLE_CONFIG_FIX.md` |
| **Comando Validación** | `npm run db:generate` (debe completar sin errores) |
| **Tiempo Debug** | ~45 minutos |

**Configuración corregida:**
```typescript
// drizzle.config.ts
export default {
  schema: './apps/web/lib/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
};
```

---

### 2025-10-17 - `ERR_CONNECTION_REFUSED` en localhost

| Campo | Descripción |
|-------|-------------|
| **Error** | Web y API no levantaban (`localhost:3001` / `localhost:4000`), error de conexión rechazada |
| **Causa Raíz** | Múltiples factores:<br>1. Procesos Node colgados en los puertos<br>2. Cache de `.next` y `.turbo` corrupto<br>3. `node_modules` con dependencias en estado inconsistente |
| **Solución** | 1. Matar todos los procesos Node: `taskkill /F /IM node.exe`<br>2. Limpiar caches: `rm -rf .next .turbo node_modules`<br>3. Reinstalar dependencias: `npm install`<br>4. Reiniciar: `npm run dev` |
| **Prevención** | - Script de limpieza automatizado<br>- Verificar puertos antes de iniciar<br>- Mantener dependencias actualizadas |
| **Referencia** | `TROUBLESHOOTING_CONNECTION_REFUSED.md`, `fix_connection_refused.bat` |
| **Comando Validación** | `curl http://localhost:3001/health` debe retornar 200 |
| **Tiempo Debug** | ~30 minutos |

**Script de limpieza creado:**
```batch
@echo off
echo Matando procesos Node...
taskkill /F /IM node.exe 2>nul

echo Limpiando caches...
rd /s /q .next 2>nul
rd /s /q .turbo 2>nul
rd /s /q node_modules 2>nul

echo Reinstalando dependencias...
call npm install

echo Reiniciando desarrollo...
call npm run dev
```

---

## Plantilla para Nuevos Registros

```markdown
### [YYYY-MM-DD HH:MM] - [Título Descriptivo del Error]

| Campo | Descripción |
|-------|-------------|
| **Error** | [Síntoma observable - qué se veía mal] |
| **Causa Raíz** | [Análisis profundo - por qué ocurrió realmente] |
| **Solución** | [Pasos concretos aplicados para resolver] |
| **Prevención** | [Cómo evitar que vuelva a ocurrir] |
| **Referencia** | [Archivo/PR/Comando relacionado] |
| **Comando Validación** | [Comando para verificar que está resuelto] |
| **Tiempo Debug** | [Tiempo aproximado dedicado] |

**Código relevante:**
```typescript
// Snippet de código si aplica
```

**Categorías:** #seguridad | #infra | #logica | #multitenancy | #testing | #ui
```

---

## Categorías de Errores

| Categoría | Descripción | Ejemplos |
|-----------|-------------|----------|
| `#seguridad` | Vulnerabilidades, RLS, auth | Data leakage, SQL injection |
| `#infra` | Configuración, deployments | Connection refused, build errors |
| `#logica` | Errores de negocio | Cálculos incorrectos, estados inválidos |
| `#multitenancy` | Aislamiento de tenants | Cross-tenant access, missing tenantId |
| `#testing` | Tests fallidos | Flaky tests, mock issues |
| `#ui` | Problemas de interfaz | Rendering, responsive, a11y |

---

## Estadísticas

| Métrica | Valor |
|---------|-------|
| Total incidentes documentados | 3 |
| Tiempo promedio de resolución | ~1.5 horas |
| Categoría más frecuente | #infra (2) |
| Incidentes de seguridad | 1 |

---

*Última actualización: 2026-03-02*
