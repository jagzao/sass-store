# Guía de Migración RLS para Tabla campaigns

## ⚠️ Advertencia Importante

Antes de ejecutar cualquier script en producción, sigue estos pasos de seguridad.

## 📋 Pasos de Seguridad Obligatorios

### 1. Hacer Backup de la Base de Datos

```bash
# En Supabase Dashboard:
# 1. Ve a Database > Backups
# 2. Crea un backup manual antes de proceder
# 3. Anota la fecha y hora del backup
```

### 2. Verificar Políticas Existentes (PRIMERO)

Ejecuta el script de verificación en el SQL Editor de Supabase:

```sql
-- Ejecutar en Supabase SQL Editor
-- Copia el contenido de: scripts/verify-campaigns-policies.sql
```

Este script NO modifica nada, solo lee información.

### 3. Revisar las Políticas

Después de ejecutar el script de verificación, revisa:

**Preguntas clave:**

- ¿Las políticas son correctas para tu caso de uso?
- ¿La política `campaigns_anon_read` debería permitir acceso anónimo?
- ¿La política `campaigns_authenticated_all` permite acceso completo a usuarios autenticados?
- ¿Hay políticas de aislamiento por tenant?

**Si las políticas NO son correctas:**

1. NO habilites RLS todavía
2. Primero corrige o elimina las políticas incorrectas
3. Luego procede con la habilitación

### 4. Probar en Ambiente de Desarrollo (Si es posible)

Si tienes un ambiente de desarrollo o staging:

1. Aplica la migración primero en desarrollo
2. Prueba todas las funcionalidades relacionadas con campaigns
3. Verifica que no haya errores de acceso
4. Solo después de pruebas exitosas, aplica en producción

## 🚀 Proceso de Migración en Producción

### Paso 1: Verificación (OBLIGATORIO)

```sql
-- Ejecutar en Supabase SQL Editor
-- Copiar y pegar el contenido de: scripts/verify-campaigns-policies.sql
```

**Revisar la salida:**

- Estado actual de RLS (debe ser false)
- Lista de políticas existentes
- Estructura de la tabla

### Paso 2: Habilitar RLS

**Opción A: Usar el script SQL (Recomendado)**

```sql
-- Ejecutar en Supabase SQL Editor
-- Copiar y pegar el contenido de: scripts/enable-rls-on-campaigns.sql
```

**Opción B: Ejecutar solo el comando esencial**

```sql
-- Solo este comando si ya revisaste las políticas
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
```

### Paso 3: Verificación Post-Migración

```sql
-- Verificar que RLS esté habilitado
SELECT
    relname AS table_name,
    relrowsecurity AS rls_enabled
FROM pg_class
WHERE relname = 'campaigns';

-- Debe mostrar: rls_enabled = true
```

### Paso 4: Pruebas Funcionales

Después de habilitar RLS, prueba:

1. **Acceso anónimo:** Verifica si usuarios no autenticados pueden ver campaigns
2. **Acceso autenticado:** Verifica que usuarios autenticados puedan acceder según sus permisos
3. **Creación de campaigns:** Verifica que se puedan crear nuevos registros
4. **Modificación de campaigns:** Verifica que los usuarios puedan modificar sus propias campaigns
5. **Eliminación de campaigns:** Verifica que los usuarios puedan eliminar sus propias campaigns

## 🔄 Rollback (Si algo sale mal)

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

## 📊 Escenarios de Políticas Comunes

### Escenario 1: Políticas Incorrectas

Si encuentras políticas como `campaigns_authenticated_all` que dan acceso completo:

**Riesgo:** Usuarios autenticados podrían ver/eliminar campaigns de otros tenants

**Solución:** Antes de habilitar RLS, crea políticas más restrictivas:

```sql
-- Ejemplo de política de aislamiento por tenant
DROP POLICY IF EXISTS campaigns_authenticated_all ON public.campaigns;

CREATE POLICY campaigns_tenant_isolation ON public.campaigns
    FOR ALL
    TO authenticated
    USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid))
    WITH CHECK (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));
```

### Escenario 2: Sin Políticas de Aislamiento

Si no hay políticas que filtren por tenant_id:

**Riesgo:** Después de habilitar RLS, nadie podrá acceder a la tabla (porque las políticas son restrictivas por defecto)

**Solución:** Crea políticas apropiadas antes de habilitar RLS

## ✅ Checklist Final Antes de Migración

- [ ] Backup de base de datos realizado
- [ ] Script de verificación ejecutado
- [ ] Políticas existentes revisadas y aprobadas
- [ ] Pruebas en desarrollo completadas (si aplica)
- [ ] Plan de rollback definido
- [ ] Equipo notificado del cambio

## 📞 Soporte

Si tienes dudas sobre las políticas:

1. Revisa la documentación de RLS de Supabase
2. Consulta con el equipo de desarrollo
3. Considera una revisión de código de las políticas antes de aplicar

## 📝 Resumen de Seguridad

| Script                        | Modifica Datos     | Riesgo  | Recomendación                |
| ----------------------------- | ------------------ | ------- | ---------------------------- |
| verify-campaigns-policies.sql | ❌ No              | 🟢 Cero | Ejecutar primero             |
| enable-rls-on-campaigns.sql   | ⚠️ Solo estructura | 🟡 Bajo | Ejecutar después de revisión |
| apply-rls-migration.js        | ⚠️ Solo estructura | 🟡 Bajo | Ejecutar después de revisión |

**El riesgo principal no es la pérdida de datos, sino la interrupción del servicio si las políticas son incorrectas.**
