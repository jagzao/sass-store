# 🔧 GUÍA PASO A PASO: Configurar Upstash Redis

## ✅ Ya tienes cuenta Upstash - Ahora sigue estos pasos:

### **PASO 1: Crear Base de Datos Redis** (2 minutos)

1. **Ve al Dashboard**: https://console.upstash.com/

2. **Click en "Create Database"**

3. **Configuración recomendada**:

   ```
   Name: sass-store-cache
   Type: Regional (más barato, suficiente para desarrollo)
   Region: us-east-1 (o el más cercano a ti)
   TLS: Enabled (seguridad)
   Eviction: No eviction (recomendado)
   ```

4. **Click "Create"**

---

### **PASO 2: Copiar Credenciales** (1 minuto)

Después de crear la DB, verás una página con detalles:

1. **Scroll hasta "REST API"** (NO uses "Connection String", usa REST API)

2. **Copia estos 2 valores**:

   ```
   UPSTASH_REDIS_REST_URL:
   https://us1-your-random-id.upstash.io

   UPSTASH_REDIS_REST_TOKEN:
   AYG5aW...tu-token-largo-aqui...
   ```

3. **Haz click en el ícono de "Copy" al lado de cada uno**

---

### **PASO 3: Agregar a .env.local** (30 segundos)

1. **Abre el archivo**: `c:\Dev\Zo\sass-store\.env.local`

2. **Agrega al FINAL del archivo**:

   ```env
   # Upstash Redis Cache
   UPSTASH_REDIS_REST_URL=https://us1-your-id.upstash.io
   UPSTASH_REDIS_REST_TOKEN=AYG5aW...pega-tu-token-aqui...
   ```

3. **Guarda el archivo** (Ctrl+S)

**⚠️ IMPORTANTE**:

- Reemplaza `https://us1-your-id.upstash.io` con TU URL
- Reemplaza `AYG5aW...` con TU TOKEN
- NO compartas estos valores (son secretos)

---

### **PASO 4: Verificar que funciona** (1 minuto)

1. **Reinicia el servidor** (si está corriendo):

   ```bash
   # Ctrl+C para detener
   npm run dev
   ```

2. **Verifica en la consola** que NO haya errores de Redis

3. **Prueba hacer una request** a cualquier tenant:

   ```
   http://localhost:3001/t/wondernails
   ```

4. **Ve al Dashboard de Upstash** → pestaña "Data Browser"
   - Deberías ver aparecer keys como `tenant:wondernails`
   - Eso significa que el cache está funcionando ✅

---

### **PASO 5: Probar el cache** (Opcional - 2 minutos)

**Método 1: Consola del navegador**

```javascript
// Abre DevTools (F12) en http://localhost:3001/t/wondernails
// Ve a Console y pega:

fetch("/api/tenants/wondernails")
  .then((r) => r.json())
  .then((data) => console.log("Primera request (de BD):", data));

// Espera 1 segundo, luego ejecuta de nuevo:
fetch("/api/tenants/wondernails")
  .then((r) => r.json())
  .then((data) => console.log("Segunda request (de CACHE):", data));

// La segunda debería ser MÁS RÁPIDA
```

**Método 2: Upstash Dashboard**

1. Ve a https://console.upstash.com/
2. Click en tu database "sass-store-cache"
3. Pestaña "Data Browser"
4. Busca: `tenant:wondernails`
5. Deberías ver el JSON del tenant almacenado

**Método 3: CLI (si tienes Redis instalado)**

```bash
# En terminal:
redis-cli -u https://tu-url.upstash.io --tls
> AUTH tu-token
> KEYS tenant:*
> GET tenant:wondernails
```

---

## 🎯 **VALIDACIÓN FINAL**

**✅ Configuración exitosa si**:

- [ ] Archivo `.env.local` tiene las 2 nuevas variables
- [ ] Servidor reiniciado sin errores
- [ ] Upstash Dashboard muestra keys en "Data Browser"
- [ ] Segunda request es más rápida que la primera

**❌ Si hay problemas**:

**Error: "Failed to connect to Redis"**

```bash
# Revisa que la URL termine en .upstash.io
# Revisa que el token esté completo (es MUY largo)
```

**Error: "Unauthorized"**

```bash
# Token incorrecto
# Copia de nuevo desde Upstash Dashboard
```

**No veo keys en Data Browser**

```bash
# Haz una request primero: http://localhost:3001/t/wondernails
# Espera 2-3 segundos
# Refresca el Data Browser
```

---

## 📊 **Monitoreo del Cache**

### **Ver estadísticas en Upstash**:

1. Dashboard → Tu database → pestaña "Metrics"
2. Verás gráficas de:
   - Commands/sec (requests al cache)
   - Hit rate (% de requests que encuentran data)
   - Bandwidth (datos transferidos)

### **Comandos útiles (Data Browser)**:

```bash
# Ver todas las keys
KEYS *

# Ver keys de tenants
KEYS tenant:*

# Ver una key específica
GET tenant:wondernails

# Borrar una key
DEL tenant:wondernails

# Borrar TODA la cache
FLUSHALL

# Ver tiempo de vida restante de una key
TTL tenant:wondernails
```

---

## 💡 **Tips Pro**

1. **Cache Hit Rate ideal**: 70-90%
   - Si es muy bajo, incrementa los TTL
   - Si es muy alto, podrías estar sirviendo data desactualizada

2. **Invalidar cache cuando actualizas**:

   ```typescript
   // Después de actualizar un tenant:
   import { tenantCache } from "@/../../packages/cache/redis";
   await tenantCache.invalidate("wondernails");
   ```

3. **Monitorea uso**:
   - Free tier: 10,000 commands/day
   - Si te acercas al límite, considera upgrade ($10/mes = 100k commands)

4. **Backup plan**:
   - Si Upstash falla, el código usa fallback a memoria
   - No rompe tu app, solo es menos eficiente

---

## 🔒 **Seguridad**

**✅ HACER**:

- Usar variables de entorno (`.env.local`)
- Agregar `.env.local` a `.gitignore` (ya debería estar)
- Usar TLS enabled
- Rotar tokens cada 6 meses

**❌ NO HACER**:

- Commitear tokens a git
- Compartir tokens públicamente
- Usar en frontend (solo backend/API routes)

---

## 📞 **Soporte**

**Si tienes problemas**:

1. Upstash Docs: https://docs.upstash.com/redis
2. Discord: https://upstash.com/discord
3. Email: support@upstash.com

**Preguntas frecuentes**:

- ¿Cuánto cuesta? → $0 para <10k commands/day
- ¿Qué pasa si llego al límite? → Se desactiva hasta el siguiente día
- ¿Puedo tener múltiples DBs? → Sí, ilimitadas en free tier
- ¿Cuánto dura la data? → Según el TTL que configures (1h para tenants)

---

**¡Listo! En ~5 minutos tendrás caching funcionando y ahorrarás $35-160/mes en costos de BD** 🚀
