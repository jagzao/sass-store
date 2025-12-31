# Pasos para Corregir RLS en Tabla campaigns

## 🎯 Resumen

Tu aplicación es **MULTI-TENANT** y las políticas actuales de campaigns son **INSEGUROS** porque no tienen aislamiento por tenant.

## 📋 Pasos a Seguir

### Paso 1: Verificar que la tabla tiene tenant_id

Ejecuta esta query en el SQL Editor de Supabase:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'campaigns'
  AND column_name = 'tenant_id';
```

**Si NO existe tenant_id:**

```sql
ALTER TABLE public.campaigns ADD COLUMN tenant_id UUID REFERENCES tenants(id);
```

---

### Paso 2: Aplicar políticas corregidas

En el SQL Editor de Supabase, copia y pega el contenido completo de:

📄 **[`scripts/fix-campaigns-policies.sql`](scripts/fix-campaigns-policies.sql:1)**

Esto hará:

1. ✅ Eliminar `campaigns_anon_read` (acceso anónimo sin restricciones)
2. ✅ Eliminar `campaigns_authenticated_all` (acceso completo sin aislamiento)
3. ✅ Crear 4 políticas nuevas de aislamiento por tenant:
   - `campaigns_authenticated_select` - Solo ver campaigns del propio tenant
   - `campaigns_authenticated_insert` - Solo crear campaigns en el propio tenant
   - `campaigns_authenticated_update` - Solo modificar campaigns del propio tenant
   - `campaigns_authenticated_delete` - Solo eliminar campaigns del propio tenant
4. ✅ Mantener `campaigns_service_role_all` (acceso administrativo correcto)

---

### Paso 3: Verificar que las políticas se crearon correctamente

Ejecuta esta query en el SQL Editor:

```sql
SELECT
    policyname,
    permissive AS is_permissive,
    roles,
    cmd AS command,
    qual AS using_expression,
    with_check AS check_expression
FROM pg_policies
WHERE tablename = 'campaigns'
ORDER BY policyname;
```

**Deberías ver:**

- `campaigns_authenticated_select` (SELECT, authenticated)
- `campaigns_authenticated_insert` (INSERT, authenticated)
- `campaigns_authenticated_update` (UPDATE, authenticated)
- `campaigns_authenticated_delete` (DELETE, authenticated)
- `campaigns_service_role_all` (ALL, service_role)

---

### Paso 4: Habilitar RLS

En el SQL Editor de Supabase, copia y pega el contenido de:

📄 **[`scripts/enable-rls-on-campaigns.sql`](scripts/enable-rls-on-campaigns.sql:1)**

O simplemente ejecuta:

```sql
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
```

---

### Paso 5: Verificar que RLS está habilitado

Ejecuta esta query:

```sql
SELECT
    relname AS table_name,
    relrowsecurity AS rls_enabled
FROM pg_class
WHERE relname = 'campaigns';
```

**Debería mostrar:**

- `table_name`: campaigns
- `rls_enabled`: true

---

### Paso 6: Probar con JWTs reales

1. **Obtén un JWT de usuario del Tenant A**
2. **Intenta ver campaigns del Tenant A** ✅ Debería funcionar
3. **Intenta ver campaigns del Tenant B** ❌ Debería fallar (sin resultados)
4. **Intenta modificar una campaign del Tenant A** ✅ Debería funcionar
5. **Intenta modificar una campaign del Tenant B** ❌ Debería fallar (error de permiso)

---

## 🔄 Rollback (si algo sale mal)

Si encuentras problemas después de habilitar RLS:

```sql
-- Deshabilitar RLS inmediatamente
ALTER TABLE public.campaigns DISABLE ROW LEVEL SECURITY;

-- Esto restaurará el comportamiento anterior
```

Luego:

1. Restaura el backup si es necesario
2. Revisa y corrige las políticas
3. Vuelve a habilitar RLS cuando las políticas sean correctas

---

## ✅ Checklist de Verificación

Antes de aplicar en producción:

- [ ] Backup de base de datos realizado
- [ ] Verificado que campaigns tiene columna tenant_id
- [ ] Revisadas las políticas existentes
- [ ] Ejecutado script de corrección de políticas
- [ ] Verificadas las nuevas políticas
- [ ] Habilitado RLS
- [ ] Probado con JWTs de diferentes tenants
- [ ] Monitoreado logs por errores de acceso

---

## 📞 Si necesitas ayuda

### Problema: Error "column tenant_id does not exist"

**Solución:** Ejecuta el ALTER TABLE del Paso 1 para agregar la columna

### Problema: Error "relation "tenants" does not exist"

**Solución:** Verifica que la tabla tenants existe antes de crear la foreign key

### Problema: "No results found" después de habilitar RLS

**Solución:** Verifica que tu app está estableciendo el contexto de tenant:

```javascript
// En tu middleware o API route
await db.execute(sql`SELECT set_config('app.current_tenant_id', $1, TRUE)`, [
  tenantId,
]);
```

### Problema: "Permission denied" después de habilitar RLS

**Solución:** Verifica que las políticas están usando la función correcta:

```sql
USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
```

---

## 📝 Documentación Adicional

- **[`CAMPAIGNS_POLICY_ANALYSIS.md`](CAMPAIGNS_POLICY_ANALYSIS.md:1)** - Análisis detallado de riesgos
- **[`RLS_MIGRATION_GUIDE.md`](RLS_MIGRATION_GUIDE.md:1)** - Guía completa de seguridad
- **[`scripts/verify-campaigns-policies.sql`](scripts/verify-campaigns-policies.sql:1)** - Script de verificación
- **[`scripts/fix-campaigns-policies.sql`](scripts/fix-campaigns-policies.sql:1)** - Script de corrección
- **[`scripts/enable-rls-on-campaigns.sql`](scripts/enable-rls-on-campaigns.sql:1)** - Script de habilitación

---

## 🎯 Resumen Final

1. ✅ Verificar tenant_id en tabla campaigns
2. ✅ Aplicar [`scripts/fix-campaigns-policies.sql`](scripts/fix-campaigns-policies.sql:1)
3. ✅ Verificar nuevas políticas
4. ✅ Habilitar RLS con [`scripts/enable-rls-on-campaigns.sql`](scripts/enable-rls-on-campaigns.sql:1)
5. ✅ Probar con JWTs reales de diferentes tenants
6. ✅ Monitorear logs por errores

**¡Listo!** Ahora tu tabla campaigns tendrá aislamiento por tenant seguro.
