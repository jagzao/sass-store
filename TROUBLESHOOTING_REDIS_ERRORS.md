# Solución: Errores de Upstash Redis en Desarrollo

## Problema Identificado

### Síntomas
1. **Error en consola del navegador**:
   ```
   ClientFetchError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
   ```

2. **Error en logs del servidor**:
   ```
   Error [UrlError]: Upstash Redis client was passed an invalid URL
   Received: "your-upstash-redis-url"
   ```

3. **APIs fallando con código 500**:
   - `/api/auth/session` → 500
   - `/api/tenants/[slug]` → 500
   - Todas las rutas que usan cache

4. **Página mostrando errores**:
   - Internal Server Error
   - "2 Issues" en la esquina inferior izquierda
   - NextAuth devolviendo HTML en lugar de JSON

## Causa Raíz

El código intentaba inicializar **Upstash Redis** con valores placeholder del archivo `.env.local`:

```env
UPSTASH_REDIS_REST_URL=your-upstash-redis-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token
```

Esto causaba que Redis fallara al inicializarse, lo que provocaba que **todas las API routes** que dependían del cache crashearan inmediatamente.

## Solución Implementada

### Cambios en `packages/database/cache.ts`

Se modificó el archivo para que Redis sea **opcional** y use un **fallback en memoria** cuando las credenciales no están configuradas:

#### Antes:
```typescript
import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
```

#### Después:
```typescript
import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client only if environment variables are set
const isRedisConfigured =
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_URL !== 'your-upstash-redis-url' &&
  process.env.UPSTASH_REDIS_REST_TOKEN &&
  process.env.UPSTASH_REDIS_REST_TOKEN !== 'your-upstash-redis-token';

const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// In-memory cache fallback for development
const memoryCache = new Map<string, { data: any; expiresAt: number }>();
```

### Modificación del método `getOrSet`:

```typescript
async getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  try {
    if (redis) {
      // Try to get from Redis cache
      const cached = await redis.get<T>(key);

      if (cached !== null) {
        return cached;
      }

      const data = await fetcher();
      await redis.setex(key, ttl, JSON.stringify(data));
      return data;
    } else {
      // Use in-memory cache
      const cached = memoryCache.get(key);
      const now = Date.now();

      if (cached && cached.expiresAt > now) {
        return cached.data;
      }

      // Cache miss or expired - fetch from database
      const data = await fetcher();

      // Store in memory cache
      memoryCache.set(key, {
        data,
        expiresAt: now + ttl * 1000,
      });

      return data;
    }
  } catch (error) {
    // Fallback to direct fetch if cache fails
    return fetcher();
  }
}
```

### Modificación del método `invalidate`:

```typescript
async invalidate(key: string): Promise<void> {
  try {
    if (redis) {
      await redis.del(key);
    } else {
      memoryCache.delete(key);
    }
  } catch (error) {
    // Log error silently
  }
}
```

## Resultado

### Antes de la corrección:
- ❌ `/api/auth/session` → 500 Error
- ❌ `/api/tenants/[slug]` → 500 Error
- ❌ Página muestra "Internal Server Error"
- ❌ NextAuth devuelve HTML en lugar de JSON

### Después de la corrección:
- ✅ `/api/auth/session` → 200 OK
- ✅ `/api/tenants/[slug]` → 200 OK
- ✅ Página carga correctamente
- ✅ NextAuth devuelve JSON válido
- ✅ Cache funciona en memoria (desarrollo)
- ✅ Compatible con Redis (producción)

## Ventajas de esta Solución

1. **Desarrollo sin dependencias externas**: No necesitas configurar Upstash Redis para desarrollar localmente
2. **Fallback automático**: Si Redis falla, usa memoria
3. **Compatible con producción**: Cuando configures Redis en producción, se usará automáticamente
4. **Sin cambios en el código que usa cache**: El API del CacheManager sigue igual
5. **Performance aceptable en desarrollo**: El cache en memoria es suficiente para desarrollo local

## Pasos para Aplicar la Solución

### 1. Limpiar archivos compilados
```bash
# Eliminar todos los .next
find . -name ".next" -type d -prune -exec rm -rf '{}' +
```

### 2. Reiniciar servidores
```bash
# Matar procesos Node.js si están colgados
# Windows: Ver kill_and_restart.bat
# Unix/Mac:
pkill -9 node

# Iniciar de nuevo
npm run dev
```

### 3. Verificar que funcione
- Abrir http://localhost:3001/t/centro-tenistico
- No debe haber errores en consola
- `/api/auth/session` debe devolver 200

## Configuración de Redis en Producción

Cuando quieras usar Redis en producción:

1. Crea una cuenta en [Upstash](https://upstash.com)
2. Crea una base de datos Redis
3. Copia las credenciales
4. Actualiza `.env.local` o `.env.production`:

```env
UPSTASH_REDIS_REST_URL=https://your-actual-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-actual-token-here
```

El sistema detectará automáticamente las credenciales válidas y usará Redis en lugar del cache en memoria.

## Logs de Verificación

### Antes del fix:
```
@sass-store/web:dev:  ⨯ Error [UrlError]: Upstash Redis client was passed an invalid URL
@sass-store/web:dev:  GET /api/auth/session 500 in 8238ms
@sass-store/web:dev:  GET /api/tenants/wondernails 500 in 8270ms
```

### Después del fix:
```
@sass-store/web:dev:  ✓ Compiled /api/auth/[...nextauth] in 2.3s (1062 modules)
@sass-store/web:dev:  GET /api/auth/session 200 in 3862ms
@sass-store/web:dev:  GET /t/centro-tenistico 200 in 10151ms
```

## Archivos Modificados

- ✅ `packages/database/cache.ts` - Implementación de Redis opcional con fallback a memoria
- ✅ `kill_and_restart.bat` - Script para reiniciar servidores limpiamente

## Consideraciones

### Cache en Memoria vs Redis

**En Desarrollo (Memoria)**:
- ✅ No requiere servicios externos
- ✅ Setup instantáneo
- ✅ Gratis
- ⚠️ Los datos se pierden al reiniciar
- ⚠️ No compartido entre instancias

**En Producción (Redis)**:
- ✅ Persistente
- ✅ Compartido entre instancias
- ✅ Escalable
- ✅ TTL automático
- ⚠️ Requiere configuración
- ⚠️ Tiene costo

## Script de Utilidad

Se creó `kill_and_restart.bat` para Windows que:
1. Mata todos los procesos Node.js
2. Limpia carpetas `.next`
3. Espera 3 segundos
4. Reinicia los servidores

Uso:
```bash
.\kill_and_restart.bat
```

---

**Última actualización**: 2025-10-17
**Archivo de documentación**: `TROUBLESHOOTING_REDIS_ERRORS.md`
**Archivo relacionado**: `packages/database/cache.ts`
