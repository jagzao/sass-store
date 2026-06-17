# 🚀 Auto-Resume Quick Start

## TL;DR - Inicio Rápido

```bash
# 1. Instalar PM2 (una sola vez)
npm install -g pm2

# 2. Iniciar daemon de auto-resume
pm2 start npm --name "autoresume" -- run autoresume:daemon

# 3. Guardar configuración
pm2 save && pm2 startup

# 4. ¡Listo! Ya tienes auto-resume automático cada 5 horas
```

---

## ¿Qué hace esto?

✅ **Reanuda automáticamente** el swarm después de 5 horas de rate limit
✅ **Chequea cada 30 minutos** si hay sesiones pausadas
✅ **3 reintentos automáticos** antes de alertar
✅ **No requiere intervención manual**

---

## Flujo Completo

### 1. Ejecutar Swarm

```bash
npm run swarm:start "implementar feature X"
```

### 2. Si alcanza rate limit...

- ✅ Se pausa automáticamente
- ✅ Guarda el estado
- ✅ Crea un bundle de continuación
- ✅ Programa reanudación para 5 horas después

### 3. Daemon detecta y reanuda

- ✅ Cada 30 min revisa bundles pausados
- ✅ Si pasaron 5h+ → reanuda automáticamente
- ✅ Si <5h → espera siguiente ventana
- ✅ Continúa desde donde quedó

---

## Verificar que Funciona

```bash
# Ver daemon corriendo
pm2 status

# Ver logs en tiempo real
pm2 logs autoresume

# Ver próxima ventana de reanudación
npm run workflow:status

# Ver sesiones activas
npm run swarm:status
```

---

## Comandos PM2 Útiles

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs autoresume

# Ver logs recientes
pm2 logs autoresume --lines 100

# Reiniciar
pm2 restart autoresume

# Detener
pm2 stop autoresume

# Eliminar
pm2 delete autoresume

# Ver todas las apps
pm2 list
```

---

## Configuración Avanzada

Edita `config/autoresume.json`:

```json
{
  "timezone": "America/Mexico_City",
  "windows": ["00:00", "05:00", "10:00", "15:00", "20:00"],
  "maxRetries": 3,
  "enabled": true,
  "checkIntervalMinutes": 30
}
```

**Parámetros:**

- `windows`: Ventanas preferidas (pero reanuda a las 5h sin importar)
- `maxRetries`: Reintentos antes de alertar (default: 3)
- `checkIntervalMinutes`: Frecuencia de chequeo (default: 30)
- `enabled`: Activar/desactivar auto-resume

---

## Sin PM2 (Alternativas)

### Windows - Task Scheduler

```powershell
schtasks /create /tn "AutoResume" /tr "cd C:\Dev\Zo\sass-store && npm run autoresume" /sc minute /mo 30
```

### Linux/Mac - Cron

```bash
crontab -e
# Agregar:
*/30 * * * * cd /path/to/sass-store && npm run autoresume >> /tmp/autoresume.log 2>&1
```

### Terminal Interactiva (no recomendado)

```bash
npm run autoresume:start
# Mantener terminal abierta
```

---

## Documentación Completa

- 📖 [Setup Detallado](docs/AUTORESUME_SETUP.md)
- 📖 [Guía de Replicación](docs/SWARM_REPLICATION_GUIDE.md)

---

## Problemas Comunes

### ❌ Daemon no inicia

```bash
# Revisar errores
npm run autoresume:start

# Verificar TypeScript
npx tsc --noEmit
```

### ❌ No reanuda después de 5 horas

```bash
# Ejecutar manualmente
npm run autoresume

# Ver bundles esperando
npm run workflow:status
```

### ❌ PM2 comando no encontrado

```bash
# Instalar globalmente
npm install -g pm2
```

---

**¡Ahora tu swarm se reanuda automáticamente! 🎉**
