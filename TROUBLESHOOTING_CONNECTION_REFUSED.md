# Solución Rápida: ERR_CONNECTION_REFUSED en localhost

## Problema
Los servidores de desarrollo no se levantan y el navegador muestra:
```
No se puede acceder a este sitio web
La página localhost ha rechazado la conexión
ERR_CONNECTION_REFUSED
```

## Síntomas
- No se puede acceder a http://localhost:3001/t/delirios ni a ningún otro tenant
- Todos los servicios parecen estar caídos
- Los procesos Node.js pueden estar colgados o corruptos

## Causa Raíz
1. **Archivos de node_modules corruptos o bloqueados** por procesos anteriores
2. **Cache de npm, Next.js y Turbo desactualizado o corrupto**
3. **Configuración de Turbo incorrecta** (turbo.json usando `tasks` en lugar de `pipeline` para versiones antiguas)
4. **Procesos Node.js zombies** que bloquean puertos

## Solución Completa (10-15 minutos)

### Paso 1: Detener todos los procesos Node.js
```bash
# Windows
taskkill /F /IM node.exe

# Unix/Mac
pkill -9 node
```

### Paso 2: Limpieza profunda de archivos
```bash
# Eliminar todos los node_modules
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# Limpiar cache de npm
npm cache clean --force

# Eliminar carpetas de cache de Next.js y Turbo
find . -name ".next" -type d -prune -exec rm -rf '{}' +
find . -name ".turbo" -type d -prune -exec rm -rf '{}' +

# Eliminar archivos adicionales de cache
rm -rf .turbo node_modules/.cache package-lock.json
```

### Paso 3: Verificar y corregir turbo.json
Revisar el archivo `turbo.json` y asegurarse de que use `pipeline` en lugar de `tasks`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {  // ← Debe ser "pipeline", no "tasks"
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    // ... resto de la configuración
  }
}
```

**Nota**: Turbo v1.x usa `pipeline`, mientras que v2.x usa `tasks`. Verificar la versión instalada con `npm list turbo`.

### Paso 4: Reinstalar dependencias
```bash
# Reinstalar con force para sobrescribir archivos problemáticos
npm install --force
```

Esto puede tardar 2-5 minutos dependiendo de la conexión y el sistema.

### Paso 5: Levantar servidores de desarrollo
```bash
npm run dev
```

Deberías ver:
```
@sass-store/web:dev: ✓ Ready in 3.6s
@sass-store/api:dev: ✓ Ready in 4.7s
```

### Paso 6: Verificar acceso
- **Web**: http://localhost:3001
- **API**: http://localhost:4000
- **Tenants**: http://localhost:3001/t/delirios, http://localhost:3001/t/wondernails, etc.

## Script de Solución Rápida

Crear un archivo `fix_connection_refused.sh` o `fix_connection_refused.bat`:

```bash
#!/bin/bash
# fix_connection_refused.sh

echo "🔧 Solucionando ERR_CONNECTION_REFUSED..."

# Paso 1: Matar procesos Node.js
echo "1️⃣ Deteniendo procesos Node.js..."
pkill -9 node 2>/dev/null || echo "No hay procesos Node.js corriendo"

# Paso 2: Limpieza profunda
echo "2️⃣ Limpiando archivos..."
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
npm cache clean --force
find . -name ".next" -type d -prune -exec rm -rf '{}' +
find . -name ".turbo" -type d -prune -exec rm -rf '{}' +
rm -rf .turbo node_modules/.cache package-lock.json

# Paso 3: Reinstalar
echo "3️⃣ Reinstalando dependencias..."
npm install --force

# Paso 4: Levantar servicios
echo "4️⃣ Levantando servicios..."
npm run dev
```

Para Windows (`fix_connection_refused.bat`):
```batch
@echo off
echo 🔧 Solucionando ERR_CONNECTION_REFUSED...

echo 1️⃣ Deteniendo procesos Node.js...
taskkill /F /IM node.exe 2>nul

echo 2️⃣ Limpiando archivos...
for /d /r . %%d in (node_modules) do @if exist "%%d" rd /s /q "%%d"
call npm cache clean --force
for /d /r . %%d in (.next) do @if exist "%%d" rd /s /q "%%d"
for /d /r . %%d in (.turbo) do @if exist "%%d" rd /s /q "%%d"
if exist package-lock.json del /q package-lock.json

echo 3️⃣ Reinstalando dependencias...
call npm install --force

echo 4️⃣ Levantando servicios...
call npm run dev
```

## Errores Comunes Durante la Solución

### Error: EPERM durante eliminación de node_modules
**Solución**: Algunos procesos siguen usando los archivos. Reiniciar y volver a intentar, o usar `--force` en npm install.

### Error: turbo_json_parse_error - unknown key 'tasks'
**Solución**: Cambiar `"tasks"` por `"pipeline"` en turbo.json (línea 4).

### Error: npm ERR! EEXIST: file already exists, symlink
**Solución**:
```bash
rm -rf node_modules/cache node_modules/next node_modules/framer-motion
npm install --force
```

### Error: Command timed out
**Solución**: Ejecutar en background o aumentar el timeout:
```bash
npm install --force &
```

## Prevención

1. **Siempre detener servidores correctamente** con `Ctrl+C` en lugar de cerrar la terminal
2. **No interrumpir npm install** mientras está ejecutándose
3. **Mantener versiones consistentes** de Turbo y Next.js
4. **Limpiar cache periódicamente**:
   ```bash
   npm cache clean --force
   rm -rf .next .turbo
   ```

## Tiempo de Solución Esperado
- Detención de procesos: 5 segundos
- Limpieza de archivos: 1-2 minutos
- Reinstalación de dependencias: 2-5 minutos
- Inicio de servidores: 10-30 segundos

**Total: 4-8 minutos**

## Referencia Rápida

| Problema | Comando Rápido |
|----------|----------------|
| Procesos colgados | `taskkill /F /IM node.exe` |
| Cache corrupto | `npm cache clean --force` |
| node_modules bloqueado | `find . -name "node_modules" -type d -prune -exec rm -rf '{}' +` |
| Turbo error | Cambiar `tasks` → `pipeline` en turbo.json |
| Reinstalar todo | `npm install --force` |

---

**Última actualización**: 2025-10-17
**Archivo de documentación**: `TROUBLESHOOTING_CONNECTION_REFUSED.md`
