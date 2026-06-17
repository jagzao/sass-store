# 🚀 Cambios Pendientes para Producción

**Fecha:** 17 de diciembre de 2025
**Estado:** ⚠️ Cambios críticos requieren atención

---

## 🔴 **CAMBIO CRÍTICO: Migración de Datos Requerida**

### **1. Campo `duration` cambió de MINUTOS a HORAS**

**⚠️ BREAKING CHANGE - Requiere migración de datos**

#### **Cambio en el Schema:**

```sql
-- ANTES
duration INTEGER (minutos)

-- AHORA
duration DECIMAL(4,1) (horas)
```

#### **Impacto:**

- ✅ **Ya aplicado en BD:** La migración `0004_dear_proudstar.sql` cambió el tipo
- ⚠️ **Datos existentes NO convertidos:** Si tienes servicios con `duration = 60` (minutos), ahora se muestran como "60 horas" ❌

#### **Acción Requerida ANTES de Deploy:**

**Opción A: Migrar datos existentes (RECOMENDADO)**

```sql
-- Convertir duración de minutos a horas
-- EJECUTAR EN PRODUCCIÓN ANTES DEL DEPLOY

UPDATE services
SET duration = ROUND((duration / 60.0)::numeric, 1)
WHERE duration > 24; -- Solo si son minutos (>24 horas no tiene sentido)

-- Ejemplo: 60 minutos → 1.0 horas
-- Ejemplo: 45 minutos → 0.8 horas (redondeado a 1 decimal)
```

**Opción B: Revertir cambio y mantener minutos**

Si prefieres mantener minutos, hay que revertir:

1. Schema: `duration: integer("duration")`
2. UI: "Duración (minutos)" y placeholder "60"
3. Display: `{service.duration} min`

---

## ✅ **Cambios Nuevos (Features)**

### **1. Sistema de Persistencia de Formularios**

**Archivos nuevos:**

- `apps/web/hooks/useFormPersist.ts` ✅

**Archivos modificados:**

- `apps/web/app/t/[tenant]/admin_services/page.tsx` ✅

**Qué hace:**

- Auto-guarda formularios en localStorage cada 500ms
- Restaura datos al reabrir modal
- Indicador "Borrador guardado"
- TTL 24 horas

**Requiere deploy:** ✅ SÍ
**Requiere migración BD:** ❌ NO (usa localStorage)
**Breaking change:** ❌ NO

---

### **2. Soporte para Videos en Servicios**

**Cambio en Schema:**

```sql
ALTER TABLE services ADD COLUMN video_url TEXT;
```

**Estado:** ✅ **Ya aplicado en BD de producción**

**Archivos modificados:**

- `packages/database/schema.ts`
- `apps/web/app/t/[tenant]/admin_services/page.tsx`

**Requiere deploy:** ✅ SÍ
**Requiere migración BD:** ✅ **YA APLICADA**
**Breaking change:** ❌ NO (columna opcional)

---

## 🧪 **Tests E2E Mejorados**

**Archivos nuevos:**

- `tests/e2e/helpers/test-helpers.ts` ✅
- `scripts/setup-tests.js` ✅
- `.env.test` ✅ (en `.gitignore`, NO commitear)

**Archivos modificados:**

- `playwright.config.ts` ✅
- `tests/e2e/example.spec.ts` ✅
- `tests/e2e/admin/services.spec.ts` ✅
- `tests/e2e/README.md` ✅
- `.gitignore` ✅

**Requiere deploy:** ❌ NO (solo para desarrollo)
**Requiere migración BD:** ❌ NO
**Breaking change:** ❌ NO

---

## 📊 **Resumen de Cambios en BD Aplicados**

La migración que ejecutamos aplicó:

### **✅ Columnas Agregadas:**

- `services.video_url` (TEXT, nullable)

### **✅ Columnas Modificadas:**

- `services.duration` INTEGER → DECIMAL(4,1) ⚠️ **REQUIERE MIGRACIÓN DE DATOS**

### **✅ Foreign Keys Agregadas:** (22 total)

- `campaigns.tenant_id` → `tenants.id`
- `reels.tenant_id` → `tenants.id`
- `reels.campaign_id` → `campaigns.id`
- Y 19 más...

### **✅ Índices Creados:** (14 total)

- `campaigns_tenant_slug_idx`
- `reels_created_idx`
- `mercadopago_payments_tenant_idx`
- Y 11 más...

### **✅ Defaults Corregidos:**

- `customers.tags` → DEFAULT ARRAY[]
- `customers.metadata` → DEFAULT '{}'
- `customer_visits.metadata` → DEFAULT '{}'
- Y varios más...

### **✅ Columnas Eliminadas:** (15 total - limpieza)

- `mercadopago_payments.mp_payment_id` (renombrada a `mercadopago_payment_id`)
- `social_posts.base_text`
- Y 13 más...

---

## 🎯 **Checklist de Deploy a Producción**

### **Antes del Deploy:**

- [ ] **CRÍTICO:** Migrar datos de `services.duration` (minutos → horas)

  ```sql
  UPDATE services
  SET duration = ROUND((duration / 60.0)::numeric, 1)
  WHERE duration > 24;
  ```

- [ ] Verificar que no hay servicios con datos corruptos:

  ```sql
  SELECT id, name, duration
  FROM services
  WHERE duration > 24 OR duration < 0.1;
  ```

- [ ] Crear backup de BD antes de deploy
  - Ir a Supabase Dashboard → Database → Backups
  - Crear backup manual

### **Durante el Deploy:**

- [ ] Hacer commit de cambios:

  ```bash
  git add apps/web/hooks/useFormPersist.ts
  git add apps/web/app/t/[tenant]/admin_services/page.tsx
  git add tests/e2e/
  git add scripts/setup-tests.js
  git add playwright.config.ts
  git add .gitignore
  git commit -m "feat: add form persistence and improve E2E tests"
  ```

- [ ] Push a repositorio:

  ```bash
  git push origin master
  ```

- [ ] Vercel detectará cambios y hará deploy automático

### **Después del Deploy:**

- [ ] Verificar que formularios guardan borradores
- [ ] Verificar que campo "Duración" muestra horas correctamente
- [ ] Verificar que videos se pueden agregar a servicios
- [ ] Probar crear/editar/eliminar servicio en producción

---

## ⚠️ **Posibles Problemas y Soluciones**

### **Problema 1: Servicios muestran duración incorrecta**

**Síntoma:** Un servicio de 1 hora muestra "60 horas"

**Causa:** No se ejecutó la migración de datos

**Solución:**

```sql
-- Ejecutar en Supabase SQL Editor
UPDATE services
SET duration = ROUND((duration / 60.0)::numeric, 1)
WHERE duration > 24;
```

### **Problema 2: Tests fallan en CI/CD**

**Síntoma:** Tests E2E fallan en GitHub Actions / Vercel

**Causa:** No hay dev server corriendo

**Solución:**

- Los tests E2E solo funcionan localmente
- En CI/CD, usar solo tests unitarios
- Configurar `playwright.config.ts` para skip en CI si es necesario

### **Problema 3: .env.test se commitea por error**

**Síntoma:** Credenciales expuestas en repositorio

**Solución Inmediata:**

```bash
# Remover del historial
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.test" \
  --prune-empty --tag-name-filter cat -- --all

# Regenerar credenciales expuestas en Supabase
```

---

## 📞 **Contacto y Recursos**

- **Supabase Dashboard:** https://supabase.com/dashboard/project/jedryjmljffuvegggjmw
- **Vercel Dashboard:** [Tu proyecto en Vercel]
- **Documentación Tests:** `tests/e2e/README.md`

---

**Última actualización:** 17 de diciembre de 2025 - 11:30 AM
**Autor:** Claude Code
**Estado:** ⚠️ Pendiente de aplicar migración de datos
