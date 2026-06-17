# 🚀 Deployment Guide - Vercel

Esta guía te llevará paso a paso para desplegar tu proyecto en Vercel.

## 📋 Pre-requisitos

1. ✅ Cuenta de GitHub (tu código debe estar en un repo)
2. ✅ Cuenta de Vercel (gratis en https://vercel.com)
3. ✅ Base de datos PostgreSQL (Neon.tech - gratis)
4. ✅ Redis cache (Upstash - gratis)

---

## 🎯 Paso 1: Preparar las Variables de Entorno

### Variables OBLIGATORIAS:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/sass_store?sslmode=require"

# Redis Cache (Upstash)
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AXxxx..."

# NextAuth
NEXTAUTH_SECRET="tu-secret-generado-con-openssl"
NEXTAUTH_URL="https://tu-dominio.vercel.app"

# API URL (apuntará a tu deployment de Vercel)
NEXT_PUBLIC_API_URL="https://tu-dominio.vercel.app"
```

### Cómo generar NEXTAUTH_SECRET:

```bash
# En terminal (Mac/Linux/WSL):
openssl rand -base64 32

# En Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## 🗄️ Paso 2: Configurar Base de Datos (Neon)

1. Ve a https://neon.tech y crea cuenta gratis
2. Crea un nuevo proyecto llamado `sass-store`
3. Copia la **Connection String** (Database URL)
4. Ejecuta las migraciones:

```bash
# Desde la raíz del proyecto:
npm run db:push
npm run db:seed
```

---

## 💾 Paso 3: Configurar Redis (Upstash)

1. Ve a https://upstash.com y crea cuenta gratis
2. Crea una nueva base de datos Redis
3. Selecciona región: `us-east-1` (más cercana a Neon)
4. Copia `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`

---

## 🌐 Paso 4: Deploy en Vercel

### Opción A: Desde GitHub (Recomendado)

1. **Push tu código a GitHub:**

   ```bash
   git add .
   git commit -m "feat: prepare for Vercel deployment"
   git push origin main
   ```

2. **Conectar Vercel:**
   - Ve a https://vercel.com/new
   - Importa tu repositorio de GitHub
   - Selecciona el proyecto `sass-store`

3. **Configurar el proyecto:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/web`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`

4. **Agregar Variables de Entorno:**
   - En Vercel Dashboard → Settings → Environment Variables
   - Agrega TODAS las variables del Paso 1
   - Aplica a: Production, Preview, Development

5. **Deploy:**
   - Click en "Deploy"
   - Espera 2-3 minutos
   - ¡Listo! 🎉

### Opción B: Desde CLI (Avanzado)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy desde apps/web
cd apps/web
vercel

# 4. Sigue las instrucciones en terminal
# Cuando pregunte por variables de entorno, usa las del Paso 1

# 5. Deploy a producción
vercel --prod
```

---

## 🔧 Paso 5: Configuración Post-Deploy

### A. Actualizar NEXTAUTH_URL

Después del primer deploy, actualiza en Vercel:

```
NEXTAUTH_URL="https://tu-proyecto.vercel.app"
```

### B. Configurar Dominio Custom (Opcional)

1. En Vercel → Settings → Domains
2. Agrega tu dominio: `tuapp.com`
3. Configura DNS según instrucciones de Vercel
4. Actualiza `NEXTAUTH_URL` con tu nuevo dominio

### C. Habilitar Multi-tenant

Si usas subdominios para tenants (`tenant1.tuapp.com`):

1. En Vercel → Settings → Domains
2. Agrega wildcard: `*.tuapp.com`
3. Actualiza:
   ```
   NEXT_PUBLIC_DOMAIN="tuapp.com"
   NEXT_PUBLIC_TENANT_DOMAIN_PATTERN="*.tuapp.com"
   ```

---

## ✅ Verificación

Después del deploy, verifica:

1. **Homepage funciona:** `https://tu-proyecto.vercel.app`
2. **Tenant funciona:** `https://tu-proyecto.vercel.app/t/wondernails`
3. **API funciona:** `https://tu-proyecto.vercel.app/api/health`
4. **Database conectada:** Verifica que veas datos

---

## 🐛 Troubleshooting

### Build Falla

```bash
# Error: "Cannot find module '@sass-store/database'"
# Solución: Asegúrate de instalar desde la raíz:
cd ../../
npm install
cd apps/web
```

### Database Connection Error

```bash
# Error: "Connection refused"
# Solución: Verifica que DATABASE_URL tenga ?sslmode=require al final
DATABASE_URL="postgresql://...?sslmode=require"
```

### Redis Connection Error

```bash
# Error: "Redis connection failed"
# Solución: Verifica que los tokens de Upstash sean correctos
# IMPORTANTE: Usa REST tokens, NO native Redis tokens
```

### NextAuth Error

```bash
# Error: "NEXTAUTH_SECRET is not set"
# Solución: Genera uno nuevo y agrégalo en Vercel:
openssl rand -base64 32
```

---

## 📊 Monitoreo

### Ver logs en tiempo real:

```bash
vercel logs --follow
```

### Ver analytics:

- Ve a Vercel Dashboard → Analytics
- Monitorea visitas, performance, errores

---

## 💰 Costos

**Plan Hobby (Gratis):**

- ✅ 100 GB bandwidth/mes
- ✅ Suficiente para 5,000-10,000 visitas/mes
- ✅ SSL automático
- ✅ Dominios custom
- ⚠️ Solo 1 usuario

**Para escalar:**

- Si superas 5,000 visitas/mes → considera Pro ($20/mes)

---

## 🎓 Recursos

- [Documentación de Vercel](https://vercel.com/docs)
- [Next.js on Vercel](https://nextjs.org/docs/deployment)
- [Neon Documentation](https://neon.tech/docs)
- [Upstash Documentation](https://upstash.com/docs)

---

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs: `vercel logs`
2. Verifica variables de entorno en Vercel Dashboard
3. Asegúrate que DATABASE_URL y Redis estén correctos
4. Verifica que las migraciones se ejecutaron: `npm run db:push`

---

**¡Felicitaciones! Tu app está en producción 🎉**
