# 🚀 Cómo Levantar el Proyecto SASS Store en Local

Guía paso a paso para levantar el proyecto SASS Store en tu máquina local.

---

## ⚡ Procedimiento Estándar (Resumen Rápido)

Si ya has instalado las dependencias antes, sigue estos pasos:

```bash
# 1. Navegar al directorio del proyecto
cd c:/Dev/Zo/sass-store

# 2. Limpiar procesos y caché (IMPORTANTE)
taskkill /F /IM node.exe
if exist apps\web\.next rmdir /s /q apps\web\.next
if exist .turbo rmdir /s /q .turbo

# 3. Iniciar el servidor
npm run dev -- --filter=@sass-store/web
```

**O en una sola línea:**

```bash
taskkill /F /IM node.exe && if exist apps\web\.next rmdir /s /q apps\web\.next && if exist .turbo rmdir /s /q .turbo && npm run dev -- --filter=@sass-store/web
```

**Acceder a la aplicación:** http://localhost:3001

---

## 📋 Requisitos Previos

- **Node.js 18+** instalado
- **npm** (viene con Node.js)
- Acceso a internet (para descargar dependencias)

---

## 🚀 Pasos para Levantar el Proyecto

### Paso 1: Verificar Node.js

Abre una terminal y ejecuta:

```bash
node --version
```

Debes ver una versión >= 18.0.0. Si no, instala Node.js desde https://nodejs.org/

---

### Paso 2: Navegar al Directorio del Proyecto

```bash
cd c:/Dev/Zo/sass-store
```

---

### Paso 3: Instalar Dependencias (Solo la primera vez)

Si es la primera vez que levantas el proyecto:

```bash
npm install
```

Este comando:

- Descarga todas las dependencias del proyecto
- Instala los paquetes de los workspaces (apps/web y packages/\*)
- Puede tardar varios minutos dependiendo de tu conexión

**Nota:** Si ya has instalado las dependencias antes, puedes saltar este paso.

---

### Paso 4: Limpiar Puerto y Caché (IMPORTANTE)

**IMPORTANTE:** Antes de levantar el proyecto, asegúrate de limpiar cualquier proceso anterior y caché.

#### 4.1 Matar todos los procesos de Node.js

```bash
# En Windows (CMD)
taskkill /F /IM node.exe
```

Este comando detendrá todos los procesos de Node.js que estén corriendo.

#### 4.2 Limpiar caché de Next.js y Turbo

```bash
# En Windows (CMD)
if exist apps\web\.next rmdir /s /q apps\web\.next
if exist .turbo rmdir /s /q .turbo
```

Este comando elimina las carpetas de caché que pueden causar problemas.

---

### Paso 5: Iniciar el Servidor de Desarrollo

**Opción A: Solo la aplicación web (RECOMENDADO)**

```bash
npm run dev -- --filter=@sass-store/web
```

**Opción B: Todos los servicios**

```bash
npm run dev
```

El servidor estará listo cuando veas:

```
@sass-store/web:dev: ✓ Ready in XXXXms
```

**NOTA IMPORTANTE:**

- Verás un mensaje de advertencia sobre "middleware" being deprecated - esto es normal y no afecta el funcionamiento
- El mensaje "Unknown host 'localhost:3001' using fallback tenant 'zo-system'" también es normal
- El servidor está funcionando correctamente cuando ves "✓ Ready"

---

### Paso 6: Acceder a la Aplicación

Abre tu navegador y navega a:

- **URL principal**: http://localhost:3001
- **Tenants de ejemplo**:
  - http://localhost:3001/t/wondernails (Salón de uñas)
  - http://localhost:3001/t/vigistudio (Peluquería)
  - http://localhost:3001/t/vainilla-vargas (Productos de belleza)
  - http://localhost:3001/t/zo-system (Tenant por defecto)

**NOTA:** La primera vez que accedas, puede tardar unos segundos en cargar mientras Next.js compila la página.

---

## 🔄 Comandos Útiles

### Verificar estado del servidor

```bash
# El servidor se ejecuta en primer plano
# Presiona Ctrl+C para detenerlo
```

### Reiniciar el servidor (Windows)

```bash
# Paso 1: Presiona Ctrl+C para detener el servidor

# Paso 2: Matar todos los procesos de Node.js
taskkill /F /IM node.exe

# Paso 3: Limpiar caché
if exist apps\web\.next rmdir /s /q apps\web\.next
if exist .turbo rmdir /s /q .turbo

# Paso 4: Reiniciar el servidor
npm run dev -- --filter=@sass-store/web
```

### Reinicio rápido (un solo comando)

```bash
taskkill /F /IM node.exe && if exist apps\web\.next rmdir /s /q apps\web\.next && if exist .turbo rmdir /s /q .turbo && npm run dev -- --filter=@sass-store/web
```

### Ver logs de la aplicación

Los logs se muestran en la terminal donde ejecutas el comando.

**Mensajes que indican que el servidor está funcionando correctamente:**

- `✓ Ready in XXXXms` - El servidor está listo
- `Local: http://localhost:3001` - La URL de acceso
- `Network: http://192.168.X.X:3001` - Acceso desde otros dispositivos en la red

**Mensajes normales que puedes ignorar:**

- `⚠ The "middleware" file convention is deprecated` - Advertencia informativa
- `Unknown host 'localhost:3001' using fallback tenant 'zo-system'` - Usa datos mock

---

## 🛠️ Scripts de Ayuda Incluidos

El proyecto incluye scripts para facilitar el desarrollo:

### Reinicio Completo Automatizado

**PowerShell (Recomendado):**

```powershell
.\restart-app.ps1
```

**CMD:**

```cmd
restart-app.cmd
```

Estos scripts:

- Detienen todos los procesos de Node.js
- Limpian caché de Next.js y Turbo
- Preguntan si deseas reinstalar dependencias
- Reinician la aplicación automáticamente

### Liberar Puerto 3001

```bash
kill_port_3001.bat
```

### Comando Manual para Windows

Si prefieres hacerlo manualmente, usa este comando en una sola línea:

```bash
taskkill /F /IM node.exe && if exist apps\web\.next rmdir /s /q apps\web\.next && if exist .turbo rmdir /s /q .turbo && npm run dev -- --filter=@sass-store/web
```

Este comando:

1. Matar todos los procesos de Node.js
2. Limpiar caché de Next.js
3. Limpiar caché de Turbo
4. Reiniciar el servidor

---

## 📊 Estructura del Proyecto

```
sass-store/
├── apps/
│   └── web/              # Next.js App Router (puerto 3001)
├── packages/
│   ├── ui/               # Componentes UI compartidos
│   ├── database/         # Esquema de base de datos
│   └── config/           # Configuración compartida
├── package.json          # Scripts del proyecto
└── turbo.json           # Configuración de Turbo
```

---

## 🔧 Configuración de Variables de Entorno

El archivo [`apps/web/.env.local`](apps/web/.env.local:1) ya está configurado con:

- **DATABASE_URL**: Supabase production (pooler puerto 6543)
- **NEXTAUTH_SECRET**: Configurado
- **NEXTAUTH_URL**: `http://localhost:3001`

**IMPORTANTE:** El proyecto actualmente usa datos MOCK (no persistentes). Para persistencia real, consulta [`README_DATABASE_SETUP.md`](README_DATABASE_SETUP.md:1).

---

## 🐛 Solución de Problemas

### Problema: "npm run dev" no funciona o el puerto está ocupado

**Solución 1: Limpiar todo y reiniciar (RECOMENDADO)**

Sigue estos pasos en orden:

```bash
# 1. Matar todos los procesos de Node.js
taskkill /F /IM node.exe

# 2. Esperar 3 segundos (opcional pero recomendado)
timeout /t 3

# 3. Limpiar caché de Next.js y Turbo
if exist apps\web\.next rmdir /s /q apps\web\.next
if exist .turbo rmdir /s /q .turbo

# 4. Reiniciar el servidor
npm run dev -- --filter=@sass-store/web
```

**Solución 2: Reinstalar dependencias**

Si el problema persiste después de limpiar caché:

```bash
# 1. Matar procesos
taskkill /F /IM node.exe

# 2. Eliminar node_modules
if exist node_modules rmdir /s /q node_modules
if exist apps\web\node_modules rmdir /s /q apps\web\node_modules
if exist packages rmdir /s /q packages

# 3. Reinstalar
npm install

# 4. Reiniciar
npm run dev -- --filter=@sass-store/web
```

**Solución 3: Usar script de reinicio**

```powershell
# PowerShell
.\restart-app.ps1
```

O en CMD:

```cmd
restart-app.cmd
```

---

### Problema: Puerto 3001 ocupado

**Solución:**

```bash
# Opción 1: Matar todos los procesos de Node.js (RECOMENDADO)
taskkill /F /IM node.exe

# Opción 2: Usar script
kill_port_3001.bat

# Opción 3: Manual
netstat -ano | findstr :3001
taskkill /F /PID <PID>
```

---

### Problema: Errores de conexión a base de datos

**Explicación:** Es normal si no has configurado una base de datos real. El proyecto usa datos MOCK para desarrollo.

**Solución:** La aplicación funcionará con datos de prueba. Para persistencia real, sigue [`README_DATABASE_SETUP.md`](README_DATABASE_SETUP.md:1).

**Mensajes normales que puedes ver:**

- "Unknown host 'localhost:3001' using fallback tenant 'zo-system'" - Normal, usa datos mock
- "High unknown host rate: 100.00%" - Normal, indica que no hay base de datos configurada

---

### Problema: Advertencia sobre "middleware" deprecated

**Mensaje:** "⚠ The 'middleware' file convention is deprecated. Please use 'proxy' instead."

**Explicación:** Esta advertencia es normal y no afecta el funcionamiento del proyecto. Es un mensaje informativo de Next.js.

**Solución:** No requiere acción. El proyecto funciona correctamente con esta advertencia.

---

### Problema: Errores de TypeScript

**Solución:** El proyecto está configurado para ignorar errores de TypeScript durante el build (ver [`apps/web/next.config.js`](apps/web/next.config.js:11)).

Si necesitas verificar tipos:

```bash
npm run typecheck
```

---

### Problema: Errores de dependencias al instalar

**Mensaje de error:** "npm ERR! code ENOENT", "npm ERR! syscall open", o similares.

**Causa:** Generalmente ocurre cuando hay problemas con la caché de npm o cuando faltan archivos en el proyecto.

**Solución:**

```bash
# 1. Limpiar caché de npm
npm cache clean --force

# 2. Eliminar node_modules y package-lock.json
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

# 3. Reinstalar dependencias
npm install
```

---

### Problema: Errores de módulos no encontrados al ejecutar el proyecto

**Mensaje de error:** "Module not found: Can't resolve 'X'"

**Causa:** Puede ser por problemas de instalación o por cambios en la estructura del proyecto.

**Solución:**

```bash
# 1. Verificar que estás en el directorio correcto
cd c:/Dev/Zo/sass-store

# 2. Reinstalar dependencias
npm install

# 3. Si el problema persiste, limpiar todo y reinstalar
taskkill /F /IM node.exe
if exist node_modules rmdir /s /q node_modules
if exist apps\web\.next rmdir /s /q apps\web\.next
if exist .turbo rmdir /s /q .turbo
npm install
```

---

### Problema: Errores de autenticación en los endpoints

**Mensaje de error:** "Unauthorized" o "401" al acceder a endpoints de la API.

**Causa:** Los endpoints requieren autenticación con NextAuth.

**Solución:**

1. Verifica que hayas iniciado sesión en la aplicación
2. Para pruebas en desarrollo, puedes usar el endpoint de autenticación de prueba
3. Verifica que las variables de entorno de autenticación estén configuradas correctamente en `apps/web/.env.local`

---

### Problema: Errores de conexión a Supabase

**Mensaje de error:** "Error connecting to database" o "Connection refused".

**Causa:** Problemas con la configuración de la base de datos o conexión a Supabase.

**Solución:**

1. Verifica que la URL de la base de datos en `apps/web/.env.local` sea correcta
2. Verifica que tengas conexión a internet
3. Si estás usando datos mock, estos errores son normales y no afectan el funcionamiento básico de la aplicación

---

### Problema: Errores de compilación de TypeScript en el módulo de finanzas

**Mensaje de error:** Errores relacionados con tipos en el módulo de finanzas.

**Causa:** Cambios recientes en la implementación del módulo de finanzas que pueden requerir actualizaciones de tipos.

**Solución:**

```bash
# 1. Verificar tipos
npm run typecheck

# 2. Si hay errores, reinstalar dependencias
npm install

# 3. Limpiar caché y reiniciar
taskkill /F /IM node.exe
if exist apps\web\.next rmdir /s /q apps\web\.next
if exist .turbo rmdir /s /q .turbo
npm run dev -- --filter=@sass-store/web
```

---

### Problema: Errores de permisos en Windows

**Mensaje de error:** "EPERM: operation not permitted", "EACCES: permission denied".

**Causa:** Problemas de permisos de Windows al eliminar archivos o directorios.

**Solución:**

1. Ejecuta la terminal como Administrador
2. Cierra VS Code y otros programas que puedan estar usando los archivos
3. Usa los scripts de reinicio incluidos en el proyecto:
   ```cmd
   restart-app.cmd
   ```

---

### Problema: El proyecto se inicia pero muestra datos incorrectos o vacíos

**Causa:** Puede ser por problemas con la carga de datos o con la conexión a la base de datos.

**Solución:**

1. Verifica que estés accediendo a un tenant válido (ej: /t/wondernails)
2. Revisa la consola del navegador por errores de JavaScript
3. Si estás usando datos mock, es normal que algunos módulos muestren datos de ejemplo
4. Para el módulo de finanzas, verifica que los endpoints estén respondiendo correctamente:
   ```
   /api/finance/kpis
   /api/finance/movements
   /api/finance/reports/sales
   ```

---

### Problema: Los cambios en el perfil de usuario no se guardan correctamente

**Síntomas:** Al cambiar el nombre del usuario en http://localhost:3001/t/zo-system/profile, aparentemente se guarda el cambio, pero al refrescar la página, el cambio no se refleja.

**Causa:** El problema ocurre porque aunque el nombre se actualiza correctamente en la base de datos, la sesión de NextAuth no se actualiza correctamente en el lado del cliente. Esto hace que el componente siga mostrando el nombre anterior de la sesión en lugar del nombre actualizado.

**Solución:** Se ha implementado una solución que fuerza la actualización completa de la sesión y recarga la página para asegurar que todos los componentes reflejen el nuevo nombre:

1. Se ha modificado la función `handleSave` en `apps/web/app/t/[tenant]/profile/page.tsx` para:
   - Forzar la actualización de la sesión con una marca de tiempo
   - Recargar la página después de un breve retraso para asegurar que todos los componentes reflejen el nuevo nombre

2. El código modificado incluye:

   ```javascript
   // Forzar una actualización completa de la sesión
   await update({
     name: formData.name.trim(),
     // Forzar la actualización de la sesión con una marca de tiempo
     _timestamp: Date.now(),
   });

   // Forzar una recarga de la página para asegurar que todos los componentes reflejen el nuevo nombre
   setTimeout(() => {
     window.location.reload();
   }, 500);
   ```

**Verificación:** Para verificar que la solución funciona:

1. Inicia sesión en la aplicación
2. Navega a http://localhost:3001/t/zo-system/profile
3. Haz clic en "Editar" junto a tu nombre
4. Cambia tu nombre y haz clic en "Guardar Cambios"
5. Verifica que aparezca el mensaje de éxito
6. La página se recargará automáticamente y mostrará el nuevo nombre
7. Si refrescas la página manualmente, el nombre seguirá siendo el nuevo

---

## 📚 Scripts Disponibles

### Desarrollo

```bash
npm run dev                          # Iniciar todos los servicios
npm run dev -- --filter=@sass-store/web  # Solo web (RECOMENDADO)
```

### Base de Datos

```bash
npm run db:push                      # Aplicar migraciones
npm run db:seed                      # Cargar datos iniciales
npm run db:generate                  # Generar nuevas migraciones
```

### Build

```bash
npm run build                        # Build para producción
npm run typecheck                    # Verificar tipos
npm run lint                         # Verificar código
```

### Tests

```bash
npm run test                         # Ejecutar tests
npm run test:e2e                     # Tests E2E con Playwright
npm run test:unit                    # Tests unitarios
npm run test:integration             # Tests de integración
```

---

## 🎯 Checklist de Verificación

Antes de empezar a desarrollar, verifica:

- [ ] Node.js 18+ instalado (`node --version`)
- [ ] Dependencias instaladas (`npm install`)
- [ ] Puerto 3001 libre (`netstat -ano | findstr :3001` no debe mostrar resultados)
- [ ] Procesos de Node.js limpiados (`taskkill /F /IM node.exe`)
- [ ] Caché de Next.js y Turbo limpiada
- [ ] Servidor iniciado (`npm run dev -- --filter=@sass-store/web`)
- [ ] Ves el mensaje `✓ Ready in XXXXms`
- [ ] Puedes acceder a http://localhost:3001
- [ ] Puedes navegar a un tenant (ej: /t/wondernails)

**NOTA:** Si ves advertencias sobre "middleware" o mensajes sobre "Unknown host", es normal y no afecta el funcionamiento.

---

## 📖 Documentación Adicional

- [`README.md`](README.md:1) - Documentación general del proyecto
- [`README_DATABASE_SETUP.md`](README_DATABASE_SETUP.md:1) - Configuración de base de datos
- [`RESTART_APP_README.md`](RESTART_APP_README.md:1) - Scripts de reinicio
- [`QUICKSTART.txt`](QUICKSTART.txt:1) - Guía rápida de deployment

---

## 💡 Tips de Desarrollo

1. **Usa `--filter=@sass-store/web`**: Es más rápido y consume menos recursos
2. **Hot reload**: Los cambios se reflejan automáticamente en el navegador
3. **Logs**: Presta atención a los logs en la terminal para detectar errores
4. **Mock data**: El proyecto usa datos de prueba por defecto, no te preocupes si no persisten
5. **Limpieza antes de iniciar**: Siempre mata los procesos de Node.js y limpia la caché antes de iniciar el servidor
6. **Advertencias normales**: Ignora las advertencias sobre "middleware" deprecated y mensajes sobre "Unknown host"
7. **Primera carga**: La primera vez que accedas a una página puede tardar unos segundos mientras Next.js la compila
8. **Reinicio rápido**: Usa el comando de una sola línea para reiniciar rápidamente:
   ```bash
   taskkill /F /IM node.exe && if exist apps\web\.next rmdir /s /q apps\web\.next && if exist .turbo rmdir /s /q .turbo && npm run dev -- --filter=@sass-store/web
   ```

---

## 🚀 Próximos Pasos

Una vez que el proyecto esté corriendo:

1. Explora los tenants de ejemplo
2. Revisa la estructura de componentes en [`apps/web/components/`](apps/web/components/)
3. Lee la documentación en [`docs/`](docs/)
4. Configura tu propia base de datos si necesitas persistencia

---

**Última actualización:** 2026-01-22
**Versión del proyecto:** 1.0.0
**Estado:** ✅ Funcionando
**Sistema operativo:** Windows 11

## 🔄 Implementación Reciente: Módulo de Finanzas

El proyecto ha sido actualizado con un nuevo módulo de finanzas que utiliza datos reales de Supabase en lugar de datos mock. Esta implementación incluye:

### Endpoints Implementados

1. **`GET /api/finance/kpis`** - Obtiene KPIs financieros agregados por tenant y período
2. **`GET /api/finance/movements`** - Obtiene movimientos financieros con filtros avanzados
3. **`POST /api/finance/pos/sales`** - Crea ventas desde el POS
4. **`GET /api/finance/pos/terminals`** - Obtiene terminales POS
5. **`POST /api/finance/pos/terminals`** - Crea terminales POS
6. **`GET /api/finance/reports/sales`** - Genera reportes de ventas
7. **`GET /api/finance/reports/products`** - Genera reportes de productos
8. **`PATCH /api/finance/movements/[id]/reconcile`** - Permite reconciliar movimientos financieros

### Cambios en el Código

- Se actualizó el hook `useFinance` para usar los nuevos endpoints
- Se corrigieron problemas de importación de autenticación en todos los endpoints
- Se implementó validación de tenant con `assertTenantAccess`
- Se agregaron cálculos de KPIs financieros en tiempo real

### Verificación del Módulo de Finanzas

Para verificar que el módulo de finanzas está funcionando correctamente:

1. Accede a la aplicación en http://localhost:3001
2. Inicia sesión con un usuario válido
3. Navega a una página que utilice el módulo de finanzas
4. Verifica que los datos se carguen correctamente sin errores

### Posibles Errores y Soluciones

**Error: "Unauthorized" al acceder a endpoints de finanzas**

- **Causa:** Los endpoints requieren autenticación
- **Solución:** Verifica que hayas iniciado sesión correctamente

**Error: "Tenant not found" o "Tenant access denied"**

- **Causa:** El tenant no existe o no tienes acceso
- **Solución:** Verifica que estés usando un tenant válido (ej: /t/wondernails)

**Error: Datos vacíos en el módulo de finanzas**

- **Causa:** Puede ser por falta de datos en la base de datos
- **Solución:** Verifica que la conexión a Supabase esté configurada correctamente
