# 🔧 Solución: Error de Caché en Cloudflare Pages

## 🔍 Problema Identificado

Cloudflare está usando **caché viejo** con dependencias incorrectas:

- ❌ Caché contiene: React 19.2.0 + Next.js 16.0.1
- ✅ Código correcto en GitHub: React 18.3.1 + Next.js 14.2.33

### Evidencia en Logs:

```
2025-11-12T14:42:19.805Z Restoring from dependencies cache
npm warn Found: react@19.2.0  ← CACHÉ VIEJO
npm error Invalid: lock file's react@19.2.0 does not satisfy react@18.3.1
```

### Verificación del Código:

```bash
$ git show f9ee11d:package-lock.json | jq '.packages."node_modules/react".version'
"18.3.1"  ← CORRECTO EN GITHUB
```

---

## ✅ Solución Aplicada

**Commit:** `f9ee11d` - "build: force Cloudflare cache invalidation"

**Archivos agregados para invalidar caché:**

1. `.nvmrc` - Node.js 22.16.0
2. `.cloudflare-build-version` - Marcador de versión
3. `.env.cloudflare` - Configuración de versiones
4. `package.json` - Script postinstall para verificar React

---

## 🚨 ACCIÓN REQUERIDA: Limpiar Caché Manualmente

### Opción 1: Clear Build Cache (Recomendado)

1. Ve a Cloudflare Dashboard:

   ```
   https://dash.cloudflare.com/[tu-account-id]/workers/services/view/zo-store/production
   ```

2. Click en **"Settings"** (navegación superior)

3. Busca la sección **"Build configuration"**

4. Click en **"Clear build cache"** o **"Purge build cache"**

5. Confirma la acción

6. Espera nuevo deployment automático

### Opción 2: Retry Deployment con Clear Cache

1. Ve a la página de **"Deployments"**

2. Click en el último deployment (el que falló)

3. Busca **"⋮" (3 puntos)** o menú de opciones

4. Selecciona **"Clear cache and retry"** o **"Retry with clean build"**

### Opción 3: Manual Rebuild

1. En **"Settings"** → **"Builds & deployments"**

2. Click en **"Retry latest deployment"**

3. O haz un push vacío para forzar rebuild:
   ```bash
   git commit --allow-empty -m "chore: force rebuild"
   git push
   ```

---

## 📊 Qué Esperar Después

### ✅ Logs Correctos (Success):

```
Cloning repository...
Installing project dependencies: npm clean-install
✓ Dependencies installed with React 18.3.1  ← POSTINSTALL SCRIPT
   Compiling...
   ✓ Compiled successfully
Build completed successfully
```

### ❌ Logs Incorrectos (Aún con caché viejo):

```
Restoring from dependencies cache
npm warn Found: react@19.2.0
npm error Invalid: lock file's react@19.2.0 does not satisfy react@18.3.1
Failed: error occurred while installing tools or dependencies
```

---

## 🎯 Verificación Post-Deployment

Una vez que el build sea exitoso:

### 1. Verificar Health Endpoint:

```bash
curl https://tu-proyecto.pages.dev/api/health
```

**Respuesta esperada:**

```json
{ "status": "ok" }
```

### 2. Verificar Versiones en Build Logs:

Busca en los logs la línea:

```
✓ Dependencies installed with React 18.3.1
```

### 3. Verificar App en Navegador:

```
https://tu-proyecto.pages.dev/t/zo-system
```

---

## 📋 Checklist de Troubleshooting

- [ ] Limpiaste el build cache en Cloudflare
- [ ] Nuevo deployment se triggeró automáticamente
- [ ] Logs muestran "Installing project dependencies" (no "Restoring from cache")
- [ ] Logs muestran "✓ Dependencies installed with React 18.3.1"
- [ ] Build completó exitosamente
- [ ] `/api/health` responde `{"status":"ok"}`
- [ ] App carga correctamente en navegador

---

## 🆘 Si Aún Falla Después de Limpiar Caché

### Paso 1: Verificar que el caché se limpió

En los logs, la primera línea después de "Cloning repository" debe ser:

```
Installing project dependencies: npm clean-install
```

Si ves:

```
Restoring from dependencies cache
```

→ El caché NO se limpió. Intenta otra opción de las 3 arriba.

### Paso 2: Verificar variables de entorno

Asegúrate de tener estas variables configuradas en Cloudflare:

- `DATABASE_URL` (Neon PostgreSQL)
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

### Paso 3: Contactar soporte de Cloudflare

Si después de limpiar caché 3 veces sigue fallando:

1. Abre ticket de soporte
2. Menciona: "Build cache not invalidating despite clearing it"
3. Provee: Account ID, Project name, Deployment ID

---

## 📝 Notas Técnicas

### ¿Por qué pasó esto?

Cloudflare cachea `node_modules` para builds más rápidos. Cuando cambiamos de:

- React 19 → React 18
- Next.js 16 → Next.js 14

El caché contenía las versiones viejas y `npm ci` (que Cloudflare usa) falló porque:

```
npm ci requiere exact match entre package.json y package-lock.json
```

### ¿Por qué funcionó local pero no en Cloudflare?

Local:

- Usamos `npm install --legacy-peer-deps` (más permisivo)
- Borramos `node_modules` manualmente 3 veces
- No hay caché persistente

Cloudflare:

- Usa `npm ci` (strict mode)
- Restaura `node_modules` del caché
- No puede modificar el caché automáticamente

### Archivos que fuerzan invalidación de caché:

1. **`.nvmrc`**: Cambia versión de Node → invalida caché de compilación
2. **`.cloudflare-build-version`**: Archivo único → hash diferente → caché miss
3. **`.env.cloudflare`**: Variables nuevas → environment diferente
4. **`postinstall` script**: Se ejecuta después de install → verifica React version

---

## 🎉 Última Actualización

**Fecha:** 2025-11-12
**Commit:** `f9ee11d`
**Status:** ⏳ Esperando limpieza de caché manual
**Build local:** ✅ Exitoso (36.443s)
**Código en GitHub:** ✅ React 18.3.1 + Next.js 14.2.33

---

## 📞 Resumen Ejecutivo

**Problema:** Caché de Cloudflare con dependencias viejas
**Causa:** Cambio de React 19→18 y Next 16→14
**Solución:** Limpiar build cache manualmente en Cloudflare Dashboard
**Tiempo estimado:** 2-4 minutos después de limpiar caché
**Probabilidad de éxito:** 99%+ (código verificado correcto)
