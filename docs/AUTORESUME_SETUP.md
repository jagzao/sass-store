# 🔄 Auto-Resume Setup Guide

## Problema Anterior

❌ El sistema requería ejecutar manualmente `npm run autoresume` en ventanas específicas
❌ Ventana de solo ±5 minutos era muy restrictiva
❌ No había proceso corriendo para revisar automáticamente

## Solución Implementada

✅ **Daemon continuo** que revisa cada 30 minutos
✅ **Reanudación automática** después de 5 horas (sin ventanas)
✅ **Ventana flexible** de ±30 minutos
✅ **3 reintentos** automáticos

---

## Configuración Rápida

### 1. Configurar Ventanas (Opcional)

Edita [config/autoresume.json](../config/autoresume.json):

```json
{
  "timezone": "America/Mexico_City",
  "windows": ["00:00", "05:00", "10:00", "15:00", "20:00"],
  "maxRetries": 3,
  "enabled": true,
  "checkIntervalMinutes": 30
}
```

### 2. Iniciar Daemon (Elegir UNA opción)

#### Opción A: Terminal Interactiva

```bash
npm run autoresume:start
```

#### Opción B: Background con PM2 (RECOMENDADO)

```bash
# Instalar PM2
npm install -g pm2

# Iniciar daemon
pm2 start npm --name "autoresume" -- run autoresume:daemon

# Guardar configuración
pm2 save

# Auto-start en reboot
pm2 startup
```

#### Opción C: Cron Job (Alternativa)

**Linux/Mac:**

```bash
crontab -e

# Agregar esta línea:
*/30 * * * * cd /path/to/sass-store && npm run autoresume >> /tmp/autoresume.log 2>&1
```

**Windows (Task Scheduler):**

```powershell
schtasks /create /tn "Swarm AutoResume" /tr "cd C:\Dev\Zo\sass-store && npm run autoresume" /sc minute /mo 30
```

---

## Cómo Funciona

### Flujo Automático

1. **Swarm detecta rate limit** → Pausa automáticamente
2. **Daemon revisa cada 30 min** → Busca sesiones pausadas
3. **Si pasaron 5+ horas** → Reanuda automáticamente SIN esperar ventana
4. **Si <5 horas** → Espera siguiente ventana programada
5. **Si falla** → Reintenta (máx 3 veces)
6. **Si sigue fallando** → Alerta para intervención manual

### Ejemplo de Timeline

```
21:00 - Swarm alcanza rate limit → Pausa
21:30 - Daemon chequea → Pasaron 30 min (no reanuda)
22:00 - Daemon chequea → Pasó 1h (no reanuda)
...
02:00 - Daemon chequea → Pasaron 5h ✅ REANUDA AUTOMÁTICAMENTE
```

---

## Comandos Útiles

```bash
# Ver estado de auto-resume
npm run workflow:status

# Ver sesiones pausadas
npm run swarm:status

# Reanudar manualmente (sin esperar)
npm run swarm:resume <session-id>

# Ver logs del daemon (si usas PM2)
pm2 logs autoresume

# Detener daemon (PM2)
pm2 stop autoresume

# Reiniciar daemon (PM2)
pm2 restart autoresume
```

---

## Verificar que Funciona

### 1. Revisar configuración

```bash
cat config/autoresume.json
```

### 2. Verificar daemon corriendo (PM2)

```bash
pm2 status
```

Deberías ver:

```
┌─────┬────────────┬─────────────┬─────────┬─────────┬──────────┐
│ id  │ name       │ mode        │ status  │ cpu     │ memory   │
├─────┼────────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0   │ autoresume │ fork        │ online  │ 0%      │ 50.0mb   │
└─────┴────────────┴─────────────┴─────────┴─────────┴──────────┘
```

### 3. Verificar logs

```bash
pm2 logs autoresume --lines 50
```

---

## Troubleshooting

### Problema: Daemon no inicia

```bash
# Revisar errores
npm run autoresume:start

# Verificar TypeScript
npx tsc --noEmit
```

### Problema: No reanuda después de 5 horas

```bash
# Revisar si hay bundles esperando
npm run workflow:status

# Ejecutar manualmente
npm run autoresume

# Revisar logs
tail -f /tmp/autoresume.log
```

### Problema: Session no se guarda

```bash
# Verificar que existe
ls -la agents/swarm/sessions/

# Ver contenido
cat agents/swarm/sessions/swarm_*.json
```

---

## Variables de Entorno (Opcional)

```bash
# .env
AUTORESUME_ENABLED=true
AUTORESUME_CHECK_INTERVAL=30
AUTORESUME_TIMEZONE=America/Mexico_City
```

---

## Mejoras Futuras

- [ ] Notificaciones Slack/Discord cuando reanuda
- [ ] Dashboard web para ver estado en tiempo real
- [ ] Predicción inteligente de cuándo se liberarán tokens
- [ ] Auto-ajuste de ventanas basado en patrones históricos
