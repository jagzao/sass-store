# 🚀 DEPLOY AHORA - Guía Rápida (10 minutos)

## ✅ Pre-requisitos (5 min)

### 1. Base de Datos (Neon) - GRATIS

```
🌐 Ve a: https://console.neon.tech/sign_in
📧 Regístrate con tu email
➕ Crea proyecto: "sass-store"
📋 Copia tu DATABASE_URL (se ve así):
   postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/sass_store?sslmode=require
```

### 2. Redis (Upstash) - GRATIS

```
🌐 Ve a: https://console.upstash.com/login
📧 Regístrate con GitHub o email
➕ Crea base de datos Redis
📍 Región: us-east-1
📋 Copia:
   UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=AXxxx...
```

### 3. Genera NEXTAUTH_SECRET

**Windows PowerShell:**

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Mac/Linux:**

```bash
openssl rand -base64 32
```

---

## 🎯 Deploy en Vercel (5 min)

### Paso 1: Sube tu código a GitHub

```bash
git add .
git commit -m "feat: ready for Vercel deployment"
git push origin main
```

### Paso 2: Import en Vercel

1. **Ve a:** https://vercel.com/new
2. **Login** con GitHub
3. **Import Repository:** Selecciona `sass-store`
4. **Configuración:**
   ```
   Framework Preset: Next.js
   Root Directory: apps/web
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

### Paso 3: Variables de Entorno

En Vercel → **Environment Variables**, agrega:

```env
# 🔴 OBLIGATORIAS
DATABASE_URL=postgresql://tu-url-de-neon?sslmode=require
UPSTASH_REDIS_REST_URL=https://tu-upstash-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=tu-token-de-upstash
NEXTAUTH_SECRET=tu-secret-generado
NEXTAUTH_URL=https://tu-proyecto.vercel.app
NEXT_PUBLIC_API_URL=https://tu-proyecto.vercel.app

# 🟡 OPCIONALES (puedes agregar después)
NEXT_PUBLIC_DOMAIN=tu-dominio.com
```

**⚠️ IMPORTANTE:** Aplica a: **Production**, **Preview**, **Development**

### Paso 4: Deploy!

1. Click **"Deploy"**
2. Espera 2-3 minutos ⏱️
3. ¡Listo! 🎉

---

## 🔧 Después del Deploy

### 1. Actualiza NEXTAUTH_URL

Una vez que tengas tu URL de Vercel (ej: `my-app.vercel.app`):

```
Ve a: Vercel Dashboard → Settings → Environment Variables
Actualiza: NEXTAUTH_URL=https://my-app.vercel.app
Actualiza: NEXT_PUBLIC_API_URL=https://my-app.vercel.app
Click: Redeploy
```

### 2. Ejecuta Migraciones de Base de Datos

```bash
# En tu computadora local:
export DATABASE_URL="tu-url-de-neon"
npm run db:push
npm run db:seed
```

### 3. Prueba tu App

```
✅ Homepage: https://tu-app.vercel.app
✅ Tenant: https://tu-app.vercel.app/t/wondernails
✅ API Health: https://tu-app.vercel.app/api/health
```

---

## 🐛 Problemas Comunes

### Build falla con "Cannot find module"

**Solución:**

```bash
cd ../../  # Volver a raíz
npm install
git add .
git commit -m "fix: update dependencies"
git push
```

### "Connection refused" en Database

**Solución:** Verifica que `DATABASE_URL` termine con `?sslmode=require`

### "NEXTAUTH_SECRET is not set"

**Solución:** Genera uno nuevo y agrégalo en Vercel Environment Variables

### Página en blanco o 500 error

**Solución:**

1. Ve a Vercel Dashboard → Deployments → Latest → Function Logs
2. Busca el error específico
3. Verifica que todas las variables de entorno estén configuradas

---

## 📊 Ver Logs

```bash
# Opción 1: Desde CLI
npm i -g vercel
vercel login
vercel logs --follow

# Opción 2: Dashboard
https://vercel.com/dashboard
→ Tu proyecto → Logs
```

---

## ✨ Siguientes Pasos

### Agregar Dominio Custom

1. Vercel Dashboard → Settings → Domains
2. Add Domain: `tuapp.com`
3. Configura DNS según instrucciones
4. Actualiza `NEXTAUTH_URL` con tu dominio

### Habilitar Multi-tenant con Subdominios

1. Agregar wildcard domain: `*.tuapp.com`
2. Actualizar variables:
   ```
   NEXT_PUBLIC_DOMAIN=tuapp.com
   NEXT_PUBLIC_TENANT_DOMAIN_PATTERN=*.tuapp.com
   ```

---

## 💰 Costos

**Plan Hobby (Gratis):**

- ✅ 100 GB bandwidth/mes
- ✅ Perfecto para 5,000 visitas/mes
- ✅ SSL automático
- ✅ No requiere tarjeta de crédito

**Si creces:**

- Plan Pro: $20/mes (hasta 50,000 visitas)

---

## 🎉 ¡Felicitaciones!

Tu app está en producción y accesible globalmente 🌍

**Comparte tu URL:** https://tu-app.vercel.app

---

## 📞 Soporte

- [Documentación Vercel](https://vercel.com/docs)
- [Deployment Guide Completo](./VERCEL_DEPLOYMENT.md)
- [Variables de Entorno Template](./.env.vercel.template)
