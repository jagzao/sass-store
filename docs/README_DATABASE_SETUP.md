# 🚀 Guía Rápida: Configuración de Base de Datos

**Estado Actual**: ⚠️ Usando datos MOCK (no persistentes)

---

## 📌 Resumen Ejecutivo

Tu aplicación está funcionando pero **NO tiene base de datos configurada**. Los datos que ves son mock data (datos de prueba que no persisten).

### ¿Qué funciona ahora?
- ✅ Todos los tenants cargan sin errores
- ✅ Puedes navegar por la aplicación
- ✅ Los productos y servicios se muestran

### ¿Qué NO funciona?
- ❌ Los datos NO persisten (se pierden al reiniciar)
- ❌ No puedes crear usuarios reales
- ❌ No puedes hacer compras reales
- ❌ No puedes crear reservas
- ❌ El carrito se resetea al refrescar

---

## ⚡ Setup Rápido (15 minutos)

### 1️⃣ Crear Base de Datos en Supabase (5 min)

```bash
# 1. Ir a: https://supabase.com/
# 2. Crear cuenta (gratis)
# 3. Crear proyecto nuevo
# 4. Copiar el "Connection String" (Transaction pooler mode)
```

### 2️⃣ Configurar Environment Variable (1 min)

```bash
# Editar archivo:
nano apps/web/.env.local

# Cambiar esta línea:
DATABASE_URL=your-database-url-here

# Por tu URL de Supabase:
DATABASE_URL="postgresql://postgres.PROJECT_ID:PASSWORD@HOST:6543/postgres?pgbouncer=true"
```

### 3️⃣ Aplicar Migraciones (5 min)

```bash
# Método 1: Automático (recomendado)
npm run db:push

# Método 2: Manual en Supabase UI
# - Ir a: Supabase Dashboard > SQL Editor
# - Ejecutar cada archivo .sql de packages/database/migrations/
```

### 4️⃣ Seed Data (2 min)

```bash
# Cargar datos iniciales (7 tenants)
npm run db:seed
```

### 5️⃣ Verificar (2 min)

```bash
# Reiniciar servidor
npm run dev

# Abrir navegador:
# http://localhost:3001/t/wondernails

# Verificar logs - debería decir:
# "Found tenant in database: Wonder Nails Studio"
```

---

## 🛠️ Scripts Disponibles

```bash
# Base de Datos
npm run db:push              # Aplicar migraciones (crea tablas)
npm run db:seed              # Cargar datos iniciales
npm run db:generate          # Generar nuevas migraciones

# Verificación
node scripts/check-db-status.js  # Test de conectividad DB

# Row Level Security
npm run rls:apply            # Aplicar políticas RLS
npm run rls:test             # Verificar aislamiento de tenants

# Desarrollo
npm run dev                  # Iniciar servidor
npm run build                # Build para producción
npm run test                 # Ejecutar tests
```

---

## 📚 Documentación Completa

Para información detallada, ver:

- **[TROUBLESHOOTING_INTERNAL_SERVER_ERROR.md](TROUBLESHOOTING_INTERNAL_SERVER_ERROR.md)** - Solución completa del error que acabamos de corregir
- **[ACTION_PLAN_DATABASE_SETUP.md](ACTION_PLAN_DATABASE_SETUP.md)** - Plan paso a paso con troubleshooting

---

## ✅ Checklist Rápido

- [ ] Base de datos creada en Supabase
- [ ] `DATABASE_URL` configurada en `.env.local`
- [ ] Migraciones aplicadas (`npm run db:push`)
- [ ] Seed data cargado (`npm run db:seed`)
- [ ] Servidor reiniciado y funciona
- [ ] Logs muestran "Found tenant in database"

---

## 🆘 Problemas Comunes

### "connection refused"
- Verificar que uses el pooler URL (puerto 6543, no 5432)
- Verificar que el proyecto de Supabase esté activo

### "password authentication failed"
- Reset password en: Supabase > Settings > Database

### "table already exists"
- Normal si ejecutas migraciones dos veces
- Ignorar o usar: `npm run db:push -- --force`

---

## 📊 Estado Actual del Proyecto

### ✅ Correcciones Aplicadas (2025-10-16)

1. **Error Handling Mejorado**: El código ahora usa mock data cuando la DB no está disponible
2. **Validación de DATABASE_URL**: Detecta URLs inválidas y no crashea
3. **Cache Optimizado**: Cachea datos mock para evitar errores repetidos
4. **API Endpoint Refactorizado**: Maneja errores correctamente sin lanzar excepciones

### ⏳ Pendientes (Requiere Acción)

1. **Configurar Base de Datos** ⭐ CRÍTICO
2. **Ejecutar Migraciones** ⭐ CRÍTICO
3. **Seed Data** ⭐ IMPORTANTE
4. **Verificar RLS** 🔸 IMPORTANTE
5. **Configurar Autenticación** 🔹 OPCIONAL
6. **Configurar Stripe** 🔹 OPCIONAL
7. **Configurar Email Service** 🔹 OPCIONAL

---

## 🎯 Próximos Pasos

1. **Ahora**: Configurar base de datos (15 min)
2. **Después**: Configurar autenticación (30 min)
3. **Luego**: Configurar pagos con Stripe (45 min)
4. **Finalmente**: Deploy a producción (1 hora)

---

**Última actualización**: 2025-10-16
**Autor**: Claude Code Agent
**Prioridad**: 🚨 ALTA
