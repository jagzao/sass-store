# Análisis de Políticas RLS - Tabla campaigns

## 📊 Políticas Actuales

### 1. `campaigns_anon_read`

```json
{
  "policyname": "campaigns_anon_read",
  "is_permissive": "PERMISSIVE",
  "roles": "{anon}",
  "command": "SELECT",
  "using_expression": "true",
  "check_expression": null
}
```

**¿Qué hace?**

- Permite a usuarios NO autenticados (anon) leer TODAS las campaigns
- Sin restricciones (using_expression = "true")

**¿Es seguro?**

- ⚠️ **RIESGO MEDIO**: Permite acceso público a campaigns sin autenticación
- Depende de tu caso de uso: ¿Deben los usuarios anónimos ver campaigns?

---

### 2. `campaigns_authenticated_all` ⚠️ **CRÍTICO**

```json
{
  "policyname": "campaigns_authenticated_all",
  "is_permissive": "PERMISSIVE",
  "roles": "{authenticated}",
  "command": "ALL",
  "using_expression": "true",
  "check_expression": "true"
}
```

**¿Qué hace?**

- Permite a CUALQUIER usuario autenticado:
  - LEER (SELECT) TODAS las campaigns
  - CREAR (INSERT) campaigns
  - MODIFICAR (UPDATE) TODAS las campaigns
  - ELIMINAR (DELETE) TODAS las campaigns
- Sin restricciones por tenant, usuario, o propietario

**¿Es seguro?**

- 🔴 **RIESGO CRÍTICO**: NO HAY AISLAMIENTO POR TENANT
- Un usuario del Tenant A puede:
  - Ver campaigns del Tenant B
  - Modificar campaigns del Tenant B
  - **Eliminar campaigns del Tenant B**

**Ejemplo del problema:**

```
Usuario: juan@tenant-a.com
Puede: Eliminar campaign del Tenant B (competencia)
Resultado: Pérdida de datos del Tenant B
```

---

### 3. `campaigns_service_role_all`

```json
{
  "policyname": "campaigns_service_role_all",
  "is_permissive": "PERMISSIVE",
  "roles": "{service_role}",
  "command": "ALL",
  "using_expression": "true",
  "check_expression": "true"
}
```

**¿Qué hace?**

- Permite al rol `service_role` acceso completo a campaigns
- `service_role` es el rol administrativo de Supabase que puede saltar RLS

**¿Es seguro?**

- ✅ **CORRECTO**: service_role debe tener acceso completo para operaciones administrativas

---

## 🚨 Problema Principal

**Si habilitas RLS con las políticas actuales:**

❌ **No hay aislamiento por tenant**

- Usuario del Tenant A puede acceder a datos del Tenant B
- Posible fuga de datos entre tenants
- Posible sabotaje entre tenants (eliminar campaigns de competencia)

❌ **No hay aislamiento por usuario**

- Cualquier usuario autenticado puede modificar campaigns creadas por otros usuarios

❌ **Violación de privacidad**

- Campaigns privadas podrían ser accesibles por usuarios no autorizados

---

## ✅ Solución Recomendada

He creado [`scripts/fix-campaigns-policies.sql`](scripts/fix-campaigns-policies.sql:1) que:

1. **Elimina políticas peligrosas:**
   - `campaigns_anon_read` (acceso anónimo sin restricciones)
   - `campaigns_authenticated_all` (acceso completo sin aislamiento)

2. **Crea políticas de aislamiento por tenant:**
   - `campaigns_authenticated_select`: Solo ver campaigns del propio tenant
   - `campaigns_authenticated_insert`: Solo crear campaigns en el propio tenant
   - `campaigns_authenticated_update`: Solo modificar campaigns del propio tenant
   - `campaigns_authenticated_delete`: Solo eliminar campaigns del propio tenant

3. **Mantiene la política correcta:**
   - `campaigns_service_role_all` (acceso administrativo)

---

## 📋 Pasos Recomendados

### Opción A: Aplicar políticas corregidas (RECOMENDADO)

```sql
-- Ejecutar en Supabase SQL Editor
-- Copiar y pegar el contenido de: scripts/fix-campaigns-policies.sql
```

**Esto hará:**

1. Eliminar políticas peligrosas
2. Crear políticas de aislamiento por tenant
3. Verificar que las políticas se crearon correctamente

**Luego:** 4. Ejecutar `scripts/enable-rls-on-campaigns.sql` para habilitar RLS

---

### Opción B: Mantener políticas actuales (NO RECOMENDADO)

Si por alguna razón necesitas mantener las políticas actuales:

⚠️ **Solo si:**

- Tu aplicación es single-tenant (no multi-tenant)
- Todos los usuarios deben poder ver/modificar todas las campaigns
- No hay datos sensibles en campaigns

**Entonces puedes:**

1. Ejecutar `scripts/enable-rls-on-campaigns.sql` directamente
2. Las políticas actuales se aplicarán

---

## 🔍 Verificación Antes de Aplicar

### 1. Verificar que la tabla tiene tenant_id

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'campaigns'
  AND column_name = 'tenant_id';
```

**Si no existe:**

```sql
ALTER TABLE public.campaigns ADD COLUMN tenant_id UUID REFERENCES tenants(id);
```

### 2. Verificar que tu app establece el tenant context

Tu middleware o API debe establecer:

```javascript
// En tu middleware o API route
await db.execute("SET LOCAL app.current_tenant_id = $1", [tenantId]);
```

### 3. Probar con un JWT real

Usa un token JWT de tu app para verificar:

- Usuario del Tenant A solo ve campaigns de Tenant A
- Usuario del Tenant A no puede modificar campaigns de Tenant B

---

## 📝 Resumen de Decisiones

| Política                      | Estado                       | Acción                |
| ----------------------------- | ---------------------------- | --------------------- |
| `campaigns_anon_read`         | ❌ Demasiado permisiva       | Eliminar o restringir |
| `campaigns_authenticated_all` | 🔴 CRÍTICA - Sin aislamiento | Eliminar y reemplazar |
| `campaigns_service_role_all`  | ✅ Correcta                  | Mantener              |

---

## 🎯 Recomendación Final

**Para una aplicación multi-tenant SaaS:**

1. ✅ Aplicar [`scripts/fix-campaigns-policies.sql`](scripts/fix-campaigns-policies.sql:1)
2. ✅ Verificar que las políticas nuevas se crearon correctamente
3. ✅ Probar con JWTs reales de diferentes tenants
4. ✅ Ejecutar `scripts/enable-rls-on-campaigns.sql` para habilitar RLS
5. ✅ Monitorear logs por errores de acceso

**Para una aplicación single-tenant:**

1. ⚠️ Revisar si realmente necesitas acceso anónimo
2. ⚠️ Si es necesario, puedes mantener las políticas actuales
3. ⚠️ Ejecutar `scripts/enable-rls-on-campaigns.sql` directamente

---

## 📞 ¿Necesitas ayuda?

Si no estás seguro:

1. ¿Tu aplicación es multi-tenant o single-tenant?
2. ¿Los usuarios anónimos deben poder ver campaigns?
3. ¿Cada tenant debe tener sus propias campaigns aisladas?

Respóndeme estas preguntas y te daré una recomendación específica para tu caso.
