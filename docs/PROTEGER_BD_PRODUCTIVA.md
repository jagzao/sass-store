# 🛡️ Guía: Proteger Base de Datos Productiva

## ✅ Respuesta Rápida

**¿Hay cambios en el esquema de BD que aplicar al servidor?**

- ❌ **NO** - Los commits recientes solo cambiaron código (tests, componentes, configuración)
- ✅ No necesitas correr migraciones ni actualizar el esquema en el servidor

---

## 🚨 Pasos Puntuales para Proteger la BD Productiva

### 📍 PASO 1: Verificar Estado Actual de la BD

Primero, confirma si tus datos están intactos o necesitas restaurar:

1. **Conectarte a Supabase Dashboard:**

   ```
   https://supabase.com/dashboard/project/jedryjmljffuvegggjmw
   ```

2. **Ir a Table Editor** y verificar:
   - ¿Hay datos en `tenants`?
   - ¿Hay datos en `users`?
   - ¿Hay datos en `customers`?

3. **Si NO hay datos → Ir a PASO 2 (Restaurar)**
4. **Si SÍ hay datos → Ir a PASO 3 (Proteger)**

---

### 📍 PASO 2: Restaurar Datos (Si se perdieron)

1. **En Supabase Dashboard:**
   - Click en **Database** (menú izquierdo)
   - Click en **Backups**

2. **Buscar backup antes del 16 de diciembre 17:00:**
   - Supabase tiene backups diarios automáticos
   - Busca el backup más reciente ANTES de que ocurriera el problema

3. **Restaurar:**
   - Click en **Restore** al lado del backup
   - Confirmar la restauración
   - Esperar 5-15 minutos

4. **Verificar:**
   - Volver a Table Editor
   - Confirmar que los datos están de vuelta

---

### 📍 PASO 3: Crear Base de Datos de Test Separada

**Opción A: Supabase Project Separado (RECOMENDADO para desarrollo)**

1. **Crear nuevo proyecto en Supabase:**

   ```
   https://supabase.com/dashboard/new
   ```

   - Nombre: `sass-store-test` o `sass-store-dev`
   - Región: La misma que tu proyecto principal
   - Password: Guárdala en tu password manager

2. **Copiar Connection String:**
   - Ve a Project Settings → Database
   - Copia la "Connection string" en modo "Session"
   - Ejemplo: `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`

3. **Agregar a `.env.local` en tu máquina:**

   ```bash
   # Base de datos de PRODUCCIÓN
   DATABASE_URL="postgresql://postgres.jedryjmljffuvegggjmw:TSGmf_3G-rbLbz!@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

   # Base de datos de TEST (proyecto separado)
   TEST_DATABASE_URL="postgresql://postgres:[TU_PASSWORD]@db.[TU_REF].supabase.co:5432/postgres"
   ```

4. **Aplicar schema a la BD de test:**
   ```bash
   npm run db:push -- --url="$TEST_DATABASE_URL"
   ```

**Opción B: Base de Datos Local (Alternativa)**

1. **Instalar PostgreSQL localmente:**
   - Windows: https://www.postgresql.org/download/windows/
   - O usar Docker:
     ```bash
     docker run --name postgres-test -e POSTGRES_PASSWORD=test123 -p 5432:5432 -d postgres:15
     ```

2. **Crear base de datos:**

   ```bash
   createdb sass_store_test
   ```

3. **Agregar a `.env.local`:**

   ```bash
   TEST_DATABASE_URL="postgresql://postgres:test123@localhost:5432/sass_store_test"
   ```

4. **Aplicar schema:**
   ```bash
   npm run db:push -- --url="$TEST_DATABASE_URL"
   ```

---

### 📍 PASO 4: Habilitar Backups Automáticos en Supabase

1. **Ir a Supabase Dashboard:**

   ```
   https://supabase.com/dashboard/project/jedryjmljffuvegggjmw
   ```

2. **Ir a Database → Backups**

3. **Verificar configuración:**
   - ✅ Daily backups: Debe estar **ENABLED**
   - ✅ Retention: Mínimo 7 días (recomendado: 30 días)
   - ✅ PITR (Point in Time Recovery): Si tu plan lo permite, activarlo

4. **Si no están habilitados:**
   - Click en **Enable automatic backups**
   - Seleccionar frecuencia (diaria recomendada)

---

### 📍 PASO 5: Separar Variables de Entorno (CRÍTICO)

1. **Nunca usar DATABASE_URL de producción localmente**

   **❌ MAL (lo que causó el problema):**

   ```bash
   # .env o .env.local
   DATABASE_URL="postgresql://...@supabase.com/postgres"  # PRODUCCIÓN
   # ← Los tests usarán esto si no hay TEST_DATABASE_URL
   ```

   **✅ BIEN:**

   ```bash
   # .env.local (desarrollo)
   DATABASE_URL="postgresql://...@localhost:5432/sass_store_test"
   TEST_DATABASE_URL="postgresql://...@localhost:5432/sass_store_test"

   # .env.production (solo en Vercel/servidor)
   DATABASE_URL="postgresql://...@supabase.com/postgres"
   ```

2. **En Vercel (producción):**
   - Ve a tu proyecto en Vercel
   - Settings → Environment Variables
   - **NO agregues** `TEST_DATABASE_URL` en producción
   - Solo tener `DATABASE_URL` apuntando a Supabase productivo

---

### 📍 PASO 6: Verificar Protecciones Están Activas

1. **Verificar que los archivos de seguridad están actualizados:**

   ```bash
   git log --oneline | grep "CRITICAL FIX"
   ```

   Debe aparecer:

   ```
   85176c9 CRITICAL FIX: Prevent tests from wiping production database
   ```

2. **Probar que los tests NO limpian producción:**

   ```bash
   # Sin TEST_DATABASE_URL configurado
   unset TEST_DATABASE_URL

   # Correr tests
   npm run test:unit

   # Deberías ver este warning:
   # "⚠️  SKIPPING cleanup - TEST_DATABASE_URL not set (safety protection)"
   ```

3. **Probar con TEST_DATABASE_URL:**

   ```bash
   # Exportar la variable temporal
   export TEST_DATABASE_URL="postgresql://localhost:5432/sass_store_test"

   # Correr tests
   npm run test:unit

   # Ahora SÍ debería limpiar (pero solo la BD de test)
   ```

---

### 📍 PASO 7: Configurar Git Hooks Seguros

1. **El pre-push hook actual YA está protegido**, pero verifica:

   ```bash
   cat .husky/pre-push
   ```

   Debe tener:

   ```bash
   echo "🧪 Running quick tests..."
   npm run test -- tests/unit/logger.spec.ts tests/unit/alerts.spec.ts tests/unit/complete-flows.test.ts --run
   ```

   ✅ Estos tests NO usan base de datos

2. **Si quieres más seguridad, agregar check:**

   Edita `.husky/pre-push` y agrega al inicio:

   ```bash
   # Safety check - prevent push if using production DB without test DB
   if [ -n "$DATABASE_URL" ] && [ -z "$TEST_DATABASE_URL" ]; then
     echo "⚠️  WARNING: DATABASE_URL is set but TEST_DATABASE_URL is not"
     echo "This could be dangerous. Set TEST_DATABASE_URL before pushing."
     exit 1
   fi
   ```

---

## ✅ Checklist Final de Seguridad

- [ ] BD de producción restaurada (si se perdieron datos)
- [ ] BD de test creada (Supabase separado o local)
- [ ] `TEST_DATABASE_URL` configurado en `.env.local`
- [ ] Backups automáticos habilitados en Supabase
- [ ] Schema aplicado a BD de test
- [ ] Tests corriendo exitosamente con BD de test
- [ ] `DATABASE_URL` de producción SOLO en Vercel, no en local
- [ ] Git hooks verificados
- [ ] Documento `CRITICAL_DATABASE_SAFETY.md` leído

---

## 🆘 En Caso de Emergencia

Si vuelve a pasar (NO debería):

1. **DETENER TODO** inmediatamente
2. **NO hacer commits ni push**
3. **Ir a Supabase Dashboard → Database → Backups**
4. **Restaurar el backup más reciente**
5. **Revisar `.env.local` y verificar que `TEST_DATABASE_URL` esté configurado**
6. **Contactar al equipo de desarrollo**

---

## 📞 Recursos

- **Supabase Dashboard:** https://supabase.com/dashboard/project/jedryjmljffuvegggjmw
- **Backups:** https://supabase.com/dashboard/project/jedryjmljffuvegggjmw/database/backups
- **Documentación Supabase Backups:** https://supabase.com/docs/guides/platform/backups

---

**Última actualización:** 16 de diciembre de 2025
**Versión:** 1.0
**Estado:** ✅ Protecciones activas
