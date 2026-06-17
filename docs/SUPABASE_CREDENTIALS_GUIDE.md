# 🔐 Guía de Credenciales y Permisos en Supabase

## ¿Qué credenciales estoy usando actualmente?

### 🔑 Credencial Usada: **DATABASE_URL** (PostgreSQL Direct Connection)

```
DATABASE_URL="postgresql://postgres.jedryjmljffuvegggjmw:TSGmf_3G-rbLbz!@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Desglose:**
- **Usuario**: `postgres.jedryjmljffuvegggjmw` (usuario superusuario de PostgreSQL)
- **Contraseña**: `TSGmf_3G-rbLbz!` (Database Password)
- **Host**: `aws-1-us-east-2.pooler.supabase.com`
- **Puerto**: `6543` (Transaction Pooler de Supabase)
- **Base de datos**: `postgres`

---

## 📋 Tipos de Claves en Supabase

### 1. **API Keys** (Para aplicaciones frontend/backend via REST API)

#### 🟢 ANON KEY (Public Key)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
```
- **Uso**: Frontend, aplicaciones públicas
- **Permisos**: Solo puede acceder a datos permitidos por RLS (Row Level Security)
- **Seguridad**: ✅ Seguro exponer públicamente
- **Acceso**: A través de Supabase REST API, Auth, Storage
- **Nivel**: `anon` role en PostgreSQL

#### 🔴 SERVICE_ROLE KEY (Secret Key)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
```
- **Uso**: Backend, scripts de servidor, migraciones
- **Permisos**: **BYPASS RLS** - acceso completo a todas las tablas
- **Seguridad**: ⚠️ **NUNCA exponer públicamente**
- **Acceso**: A través de Supabase REST API con permisos totales
- **Nivel**: `service_role` en PostgreSQL

### 2. **Database Password** (Para conexiones directas a PostgreSQL)

#### 🔴 DATABASE PASSWORD
```
TSGmf_3G-rbLbz!
```
- **Uso**: Conexiones directas a PostgreSQL, migraciones, scripts
- **Permisos**: **SUPERUSUARIO** - control total de la base de datos
- **Seguridad**: ⚠️ **NUNCA exponer públicamente**
- **Acceso**: Conexión directa a PostgreSQL (sin pasar por API de Supabase)
- **Nivel**: `postgres` superuser role

### 3. **Project URL & API URL**

```
Project URL: https://jedryjmljffuvegggjmw.supabase.co
API URL: https://jedryjmljffuvegggjmw.supabase.co/rest/v1
```
- **Uso**: Para hacer llamadas a la API REST de Supabase
- **Requiere**: Combinarse con ANON_KEY o SERVICE_ROLE_KEY

---

## 🎯 ¿Qué Estoy Usando Exactamente?

### Para las Migraciones y Scripts

Estoy usando **DATABASE_URL** con la **Database Password**, lo que me da:

✅ **Permisos completos:**
- Crear tablas (`CREATE TABLE`)
- Modificar esquemas (`ALTER TABLE`)
- Crear políticas RLS (`CREATE POLICY`)
- Insertar/actualizar/eliminar datos sin restricciones
- Crear triggers, funciones, índices
- Modificar cualquier configuración de la base de datos

✅ **Ventajas:**
- Acceso completo para migraciones
- No bloqueado por RLS
- Puede ejecutar cualquier SQL

⚠️ **Consideraciones de Seguridad:**
- Esta contraseña tiene **permisos de superusuario**
- Solo debe usarse en **entornos seguros** (backend, scripts locales)
- **NUNCA** incluir en código frontend
- **NUNCA** commitear en Git públicamente

---

## 📍 ¿Dónde Encontrar Estas Credenciales?

### En el Dashboard de Supabase:

1. **Database Password**:
   - Ve a: `Settings` → `Database`
   - Sección: **Connection String** o **Database Password**
   - Nota: Solo se muestra una vez al crear el proyecto

2. **API Keys**:
   - Ve a: `Settings` → `API`
   - Encontrarás:
     - `anon` / `public` key
     - `service_role` key

3. **Connection Pooler**:
   - Ve a: `Settings` → `Database`
   - Sección: **Connection Pooling**
   - Puerto `6543` (Transaction) o `5432` (Session)

---

## 🔒 Mejores Prácticas de Seguridad

### ✅ LO QUE HAGO CORRECTAMENTE:

1. **Variables de Entorno**: Las credenciales están en `.env.local`, no en el código
2. **Puerto 6543**: Uso el pooler de transacciones (más eficiente)
3. **Conexión SSL**: La URL incluye configuración segura

### ⚠️ LO QUE DEBERÍAS HACER:

1. **Gitignore**: Asegúrate que `.env.local` esté en `.gitignore`
2. **Rotación de Claves**: Considera rotar la Database Password periódicamente
3. **Variables por Ambiente**:
   - `.env.local` → Desarrollo
   - `.env.production` → Producción (con credenciales diferentes)
4. **Usar Service Role Key para APIs**: Para operaciones backend via API REST

---

## 🔄 Alternativas de Conexión

### Opción 1: Database Password (Actual) ✅
```typescript
const sql = postgres(DATABASE_URL);
```
- **Pros**: Acceso completo, ideal para migraciones
- **Contras**: Debe mantenerse ultra secreto
- **Uso**: Scripts de migración, seed data

### Opción 2: Service Role Key via Supabase JS
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jedryjmljffuvegggjmw.supabase.co',
  'SERVICE_ROLE_KEY'
);
```
- **Pros**: Bypass RLS, pero más limitado que conexión directa
- **Contras**: No puede crear tablas o modificar esquemas
- **Uso**: Operaciones CRUD sin RLS en backend

### Opción 3: Anon Key via Supabase JS (Frontend)
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jedryjmljffuvegggjmw.supabase.co',
  'ANON_KEY'
);
```
- **Pros**: Seguro para frontend, respeta RLS
- **Contras**: Solo acceso a datos permitidos por políticas
- **Uso**: Aplicaciones frontend, apps móviles

---

## 📊 Matriz de Permisos

| Operación | ANON KEY | SERVICE_ROLE KEY | DATABASE PASSWORD |
|-----------|----------|------------------|-------------------|
| SELECT con RLS | ✅ | ✅ | ✅ |
| SELECT sin RLS | ❌ | ✅ | ✅ |
| INSERT/UPDATE/DELETE con RLS | ✅ | ✅ | ✅ |
| INSERT/UPDATE/DELETE sin RLS | ❌ | ✅ | ✅ |
| CREATE TABLE | ❌ | ❌ | ✅ |
| ALTER TABLE | ❌ | ❌ | ✅ |
| CREATE POLICY | ❌ | ❌ | ✅ |
| CREATE TRIGGER | ❌ | ❌ | ✅ |
| DROP TABLE | ❌ | ❌ | ✅ |
| Ejecutar SQL Raw | ❌ | ⚠️ Limitado | ✅ |

---

## 🎯 Recomendación para Tu Proyecto

### Para Migraciones (Actual) ✅
```bash
DATABASE_URL="postgresql://postgres.xxx:PASSWORD@...pooler.supabase.com:6543/postgres"
```

### Para Backend API (Recomendado para futuro)
```bash
SUPABASE_URL="https://jedryjmljffuvegggjmw.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Para Frontend (Público)
```bash
NEXT_PUBLIC_SUPABASE_URL="https://jedryjmljffuvegggjmw.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## ⚠️ IMPORTANTE: Seguridad

### ❌ NUNCA:
- Commitear `.env.local` o `.env` a Git público
- Exponer DATABASE_PASSWORD en frontend
- Usar SERVICE_ROLE_KEY en código cliente
- Compartir credenciales por email o chat sin encriptar

### ✅ SIEMPRE:
- Mantener credenciales en archivos `.env*`
- Agregar `.env*` a `.gitignore`
- Usar variables de entorno diferentes por ambiente
- Rotar claves si fueron expuestas
- Usar ANON_KEY para operaciones de usuario final

---

## 🔍 Verificar Tu Configuración

### Donde están tus credenciales actualmente:

```
apps/web/.env.local    → DATABASE_URL (con Database Password)
```

### ¿Es seguro?
✅ SÍ, si:
- `.env.local` está en `.gitignore`
- Solo se usa en desarrollo local o backend seguro
- No se expone en frontend

❌ NO, si:
- Está commiteado en Git público
- Se usa en código frontend
- Se comparte sin protección

---

## 📝 Conclusión

**Para tus scripts de migración**, estoy usando la **Database Password** a través de `DATABASE_URL`, que proporciona:

- ✅ Permisos de superusuario PostgreSQL
- ✅ Capacidad de crear/modificar esquemas
- ✅ Bypass total de RLS
- ✅ Ejecución de cualquier SQL

Esto es **correcto y apropiado** para migraciones, pero debe mantenerse **ultra secreto** y solo usarse en entornos de backend seguros.
