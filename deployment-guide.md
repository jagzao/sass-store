# 🚀 Deployment Guide - Sass Store

## 📋 Stack y Arquitectura Completa

### 🔧 **Stack Tecnológico:**

```
Frontend: Next.js 14 + React + TypeScript + Tailwind CSS + Framer Motion
Backend: Next.js API Routes (Multi-tenant)
ORM: Drizzle ORM + PostgreSQL
Estado: Jotai (Atomic State Management)
Animaciones: Framer Motion con transiciones ease-in
Auth: JWT + Row Level Security (RLS)
Hosting: Vercel (Frontend) + Railway/Supabase (Database)
```

### 🗄️ **Base de Datos (PostgreSQL):**

```sql
SCHEMA COMPLETO:
├── tenants (7 tenants configurados)
├── products (catálogo por tenant)
├── services (servicios/reservas por tenant)
├── staff (personal por tenant)
├── bookings (sistema de reservas)
├── media_assets (archivos multimedia)
├── tenant_quotas (límites por tenant)
└── audit_logs (trazabilidad completa)
```

### 🏢 **Tenants Configurados:**

1. **zo-system** - Desarrollo de software (tenant principal)
2. **wondernails** - Estudio de manicure
3. **vigistudio** - Salón de belleza
4. **centro-tenistico** - Clases de tenis
5. **vainilla-vargas** - Vainilla premium
6. **delirios** - Comida saludable
7. **nom-nom** - Tacos auténticos

## 🌐 **Opciones de Hosting Productivo:**

### **Opción 1: Vercel + Supabase (Recomendado)**

```bash
# Base de datos
- Supabase PostgreSQL (gratis hasta 500MB)
- Row Level Security habilitado
- Backups automáticos

# Frontend/Backend
- Vercel (gratis para proyectos personales)
- Edge Functions
- Automatic deployments
```

**Configuración:**

1. Crear proyecto en Supabase
2. Ejecutar migrations: `npx drizzle-kit push:pg`
3. Ejecutar seed: `psql -h db.xxx.supabase.co -U postgres -d postgres -f seed.sql`
4. Deploy en Vercel con variables de entorno

### **Opción 2: Railway (Full-Stack)**

```bash
# Todo en Railway
- PostgreSQL + Redis incluidos
- $5/mes por servicio
- Auto-deploy desde GitHub
```

### **Opción 3: DigitalOcean App Platform**

```bash
# Económico y escalable
- PostgreSQL managed
- $12/mes aproximadamente
- Auto-scaling
```

## ⚙️ **Variables de Entorno Productivas:**

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
REDIS_URL="redis://user:pass@host:6379"

# Auth
JWT_SECRET="production-jwt-secret-256-bits"
NEXTAUTH_SECRET="nextauth-secret"
NEXTAUTH_URL="https://your-domain.com"

# API
NEXT_PUBLIC_API_URL="https://api.your-domain.com"

# Optional - Media Storage
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

## 📦 **Deploy Steps:**

### **1. Preparar Base de Datos:**

```bash
# Generar migrations
npx drizzle-kit generate:pg

# Push schema to production
npx drizzle-kit push:pg

# Seed data
psql $DATABASE_URL -f packages/database/seed.sql
```

### **2. Deploy Frontend:**

```bash
# Vercel
npm i -g vercel
vercel --prod

# O Railway
railway up
```

### **3. Verificar Multi-tenancy:**

```bash
# Test endpoints
curl https://your-domain.com/api/tenants
curl https://your-domain.com/?tenant=wondernails
curl https://your-domain.com/?tenant=zo-system
```

## 🔐 **Seguridad Implementada:**

- ✅ **Row Level Security (RLS)** en PostgreSQL
- ✅ **Tenant isolation** por tenant_id
- ✅ **JWT authentication**
- ✅ **Input validation**
- ✅ **Rate limiting**
- ✅ **Audit trails**

## 📊 **Monitoreo:**

```bash
# Health checks
GET /api/health

# Metrics por tenant
GET /api/metrics?tenant=zo-system

# Database stats
SELECT * FROM tenant_quotas;
```

## 🚀 **Recomendación de Hosting:**

**Para MVP/Demo**: Vercel + Supabase (Gratis)
**Para Producción**: Railway ($15/mes total)
**Para Escala**: DigitalOcean + CloudFlare ($25/mes)

¿Cuál prefieres para el deployment?
