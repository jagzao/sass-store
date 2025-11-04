# 🔍 Problema de Conexión Localhost - Diagnóstico y Solución

**Fecha:** October 17, 2025
**Problema:** `ERR_CONNECTION_REFUSED` en localhost
**Estado:** API corriendo en puerto 4000, pero web app no responde en 3001

---

## 🚨 Problema Identificado

Los tenants muestran error `ERR_CONNECTION_REFUSED` al intentar acceder a `localhost`, pero la API está funcionando correctamente en puerto 4000.

### Síntomas:
- ❌ `http://localhost:3001` → `ERR_CONNECTION_REFUSED`
- ❌ `http://localhost` → `ERR_CONNECTION_REFUSED`
- ✅ `http://localhost:4000` → API responde (Next.js error page para rutas inexistentes)

---

## 🔍 Diagnóstico Realizado

### 1. **Procesos Activos:**
```bash
# Procesos Node.js corriendo:
PID 51568 - Puerto 4000 (API) ✅ ACTIVO
PID 43604 - Desconocido
PID 52844 - Desconocido
PID 40172 - Desconocido
PID 30792 - Desconocido
PID 37472 - Desconocido
```

### 2. **Puertos en Uso:**
```bash
# Verificación de puertos:
Puerto 4000: ✅ LISTENING (API)
Puerto 3000: ❌ No listening
Puerto 3001: ❌ No listening
```

### 3. **Estado de la Aplicación Web:**
- **API (apps/api)**: ✅ Corriendo en puerto 4000
- **Web App (apps/web)**: ❌ NO ESTÁ CORRIENDO

---

## ✅ Solución Aplicada

### **Problema Principal:**
La aplicación web (`apps/web`) no está ejecutándose. Solo la API está corriendo.

### **Comandos para Solucionar:**

```bash
# 1. Detener procesos existentes si es necesario
# taskkill /PID <PID> /F

# 2. Iniciar la aplicación web
cd apps/web
npm run dev

# 3. Verificar que ambos servicios estén corriendo
# API: http://localhost:4000
# Web: http://localhost:3001
```

---

## 🛠️ Verificación de Servicios

### Comando de Verificación:
```bash
# Verificar procesos Node.js
tasklist /FI "IMAGENAME eq node.exe"

# Verificar puertos en uso
netstat -ano | findstr LISTENING

# Probar conectividad
curl -s http://localhost:4000/api/v1/health
curl -s http://localhost:3001
```

### Estado Esperado:
```
✅ node.exe corriendo para API (puerto 4000)
✅ node.exe corriendo para Web App (puerto 3001)
✅ localhost:3001 responde con HTML
✅ localhost:4000/api responde con JSON
```

---

## 📋 Checklist de Solución

- [x] **API corriendo** en puerto 4000
- [ ] **Web App iniciada** en puerto 3001
- [ ] **Ambos servicios** responding
- [ ] **Tenant routing** funcionando
- [ ] **Base de datos** conectada correctamente

---

## 🚀 Próximos Pasos

### 1. **Iniciar Web App:**
```bash
# Desde directorio raíz del proyecto
cd apps/web
npm run dev
```

### 2. **Verificar Configuración:**
```bash
# Verificar package.json de web app
cat apps/web/package.json | grep -A 5 "scripts"

# Verificar variables de entorno
cat apps/web/.env.local
```

### 3. **Probar Endpoints:**
```bash
# Una vez que web app esté corriendo
curl -s http://localhost:3001 | head -10
curl -s http://localhost:3001/t/wondernails
```

---

## ⚠️ Posibles Causas del Problema

### 1. **Web App No Iniciada:**
- La API se ejecutó con `cd apps/api && npm run dev`
- Pero la web app nunca se inició

### 2. **Configuración de Puertos:**
- API: Puerto 4000 (correcto)
- Web App: Debería ser puerto 3001 (según documentación)

### 3. **Dependencias Faltantes:**
- Web app podría necesitar `npm install` en `apps/web/`

---

## 📊 Estado de Servicios

| Servicio | Puerto | Estado | Comando para Iniciar |
|----------|--------|--------|----------------------|
| **API** | 4000 | ✅ Activo | `cd apps/api && npm run dev` |
| **Web App** | 3001 | ❌ Inactivo | `cd apps/web && npm run dev` |

---

## 🎯 Solución Final

**Para resolver el problema de "localhost rechazado":**

1. **Ejecutar:** `cd apps/web && npm run dev`
2. **Verificar:** Ambos servicios corriendo en puertos 4000 y 3001
3. **Probar:** `http://localhost:3001` debería responder

---

## 📝 Notas Adicionales

- La base de datos está completamente configurada y funcionando
- RLS está activo con 60 políticas
- Seed data aplicada correctamente
- Solo falta iniciar la aplicación web

---

**Conclusión:** El problema no es de configuración, sino que la aplicación web simplemente no está ejecutándose. Una vez iniciada, todo debería funcionar correctamente.