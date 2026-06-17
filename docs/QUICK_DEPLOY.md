# 🚀 Quick Deploy Guide - 5 Minutes to Production

## ✅ Pre-requisitos (Costo: $0.00)

### 1. Crear cuenta Neon (PostgreSQL) - FREE

```bash
# 1. Ir a https://neon.tech
# 2. Sign up (GitHub o email)
# 3. Crear nuevo proyecto: "sass-store"
# 4. Copiar connection string
```

### 2. Crear cuenta Upstash (Redis) - FREE

```bash
# 1. Ir a https://upstash.com
# 2. Sign up (GitHub o email)
# 3. Crear nuevo Redis database: "sass-store-cache"
# 4. Tab "Details" → Copiar REST URL y Token
```

### 3. Crear cuenta Cloudflare - FREE

```bash
# 1. Ir a https://dash.cloudflare.com
# 2. Sign up
# 3. Pages → Create a project
# 4. Connect to Git → Seleccionar tu repo
```

## 🔧 Setup en 5 Pasos

### Paso 1: Push Schema a Neon (1 min)

```bash
# Crear .env.local con tu Neon URL
echo 'DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/sass_store?sslmode=require"' > apps/web/.env.local

# Push schema
npm run db:push

# ✅ Verificar: Ver tablas en Neon Dashboard → Tables
```

### Paso 2: Configurar Cloudflare Pages (2 min)

En Cloudflare Dashboard → Pages → tu proyecto → Settings → Environment Variables:

```bash
# REQUIRED
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/sass_store?sslmode=require
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxx...
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://tu-proyecto.pages.dev

# OPTIONAL (solo si usas)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Paso 3: Configurar Build Settings (30 seg)

En Cloudflare Pages → Build Settings:

```
Framework preset: Next.js
Build command: npm run build:cloudflare
Build output directory: apps/web/out
Root directory: /
Node version: 18
```

### Paso 4: Deploy (1 min)

```bash
# Opción A: Push a main branch
git push origin main
# Cloudflare auto-deploys

# Opción B: Manual deploy con Wrangler
npm install -g wrangler
wrangler login
npm run deploy:production
```

### Paso 5: Verificar (30 seg)

```bash
# 1. Ver logs en Cloudflare Pages → Deployments
# 2. Abrir URL: https://tu-proyecto.pages.dev
# 3. Ir a: https://tu-proyecto.pages.dev/t/zo-system
# 4. ✅ Debería cargar la página del tenant
```

## 🎯 Troubleshooting Rápido

### Error: "Database connection failed"

```bash
# Verificar DATABASE_URL en Cloudflare Variables
# Debe incluir ?sslmode=require
# Verificar IP allowlist en Neon (debe estar en 0.0.0.0/0)
```

### Error: "Redis connection failed"

```bash
# Verificar UPSTASH_REDIS_REST_URL y TOKEN
# Usar REST endpoint, NO el native endpoint
```

### Error: "Build failed"

```bash
# Verificar logs en Cloudflare Deployments
# Común: Dependencies faltantes
# Solución: npm install en local, commit package-lock.json
```

## 📊 Verificar Costos = $0

### Neon Dashboard

```
Compute time used: X / 191.9 hours (should be < 50h for small site)
Storage: X / 3 GB
```

### Upstash Dashboard

```
Daily commands: X / 10,000 (should be < 5,000 for small site)
Storage: X / 256 MB
```

### Cloudflare Dashboard

```
Requests: X / 100,000 per day (unlimited on Pages)
Builds: X / 500 per month
```

## 🔐 Security Checklist

- [x] DATABASE_URL incluye `?sslmode=require`
- [x] NEXTAUTH_SECRET es aleatorio (32+ chars)
- [x] Variables sensibles solo en Cloudflare (NO en repo)
- [x] Neon IP allowlist: `0.0.0.0/0` (Cloudflare IPs son dinámicos)
- [x] CSP headers configurados (next.config.js)

## 🎉 Post-Deploy

### Custom Domain (Opcional - FREE)

```bash
# En Cloudflare Pages → Custom domains
# 1. Add domain: tudominio.com
# 2. Update DNS (auto si está en Cloudflare)
# 3. SSL se activa automáticamente
```

### Monitoreo

```bash
# Deploy cost monitor worker
cd cloudflare
wrangler deploy

# Configurar Slack webhook (opcional)
wrangler secret put SLACK_WEBHOOK_URL
```

### Seed Data

```bash
# Local seed
npm run db:seed

# Para ver data en producción
# Conectar a Neon DB directamente:
psql "$DATABASE_URL"
```

---

## 📝 Resumen de Costos

| Servicio           | Free Tier         | Uso Esperado   | Costo        |
| ------------------ | ----------------- | -------------- | ------------ |
| Cloudflare Pages   | Unlimited         | ~1K builds/mes | $0           |
| Neon PostgreSQL    | 192h compute      | ~30h/mes       | $0           |
| Upstash Redis      | 300K commands/mes | ~50K/mes       | $0           |
| Cloudflare Workers | 100K req/día      | ~1K/día        | $0           |
| **TOTAL**          |                   |                | **$0.00** ✅ |

**Capacidad estimada con FREE tier:**

- 1,000 usuarios/mes
- 10,000 page views/mes
- 50-100 órdenes/mes

**Para escalar** (si creces):

- Neon Pro: $19/mes → 750h compute
- Upstash Pro: $10/mes → 1M commands
- Cloudflare Workers Paid: $5/mes → 10M requests

---

**¿Listo para deploy?** ✅

```bash
npm run deploy:production
```

🎉 Tu app estará live en https://tu-proyecto.pages.dev en ~2 minutos!
