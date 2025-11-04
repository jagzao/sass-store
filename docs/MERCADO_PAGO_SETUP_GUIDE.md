# 🚀 Guía Completa: Configuración de Mercado Pago para Sass Store

## 📋 Información General

Esta guía te ayudará a configurar Mercado Pago para integrar pagos reales en tu plataforma Sass Store. El sistema soporta tanto **modo sandbox** (pruebas) como **modo producción**.

### ⚠️ Requisitos Previos

- ✅ Cuenta de Mercado Pago (crea una si no tienes)
- ✅ Aplicación registrada en el dashboard de desarrolladores
- ✅ Credenciales OAuth configuradas
- ✅ Variables de entorno actualizadas

---

## 🔧 PASO 1: Crear Cuenta en Mercado Pago

### 1.1 Registrarse en Mercado Pago

1. Ve a [https://www.mercadopago.com.mx/](https://www.mercadopago.com.mx/)
2. Haz clic en **"Crear cuenta"**
3. Completa el registro con:
   - Email válido
   - Datos personales
   - Información fiscal (RFC si eres persona moral)

### 1.2 Verificar tu Cuenta

1. Revisa tu email para el código de verificación
2. Completa la verificación de identidad
3. Configura tu método de cobro (cuenta bancaria o tarjeta)

### 1.3 Activar Modo Desarrollador

1. Ve a [https://developers.mercadopago.com/](https://developers.mercadopago.com/)
2. Inicia sesión con tu cuenta de Mercado Pago
3. Acepta los términos y condiciones

---

## 🛠️ PASO 2: Crear Aplicación en Dashboard de Desarrolladores

### 2.1 Acceder al Dashboard

1. Ve a [https://developers.mercadopago.com/dashboard](https://developers.mercadopago.com/dashboard)
2. Haz clic en **"Crear aplicación"**

### 2.2 Configurar la Aplicación

**Nombre de la aplicación:** `Sass Store - [Nombre de tu negocio]`

**Tipo de aplicación:** `Web`

**Redirect URIs para OAuth:**

```
Sandbox:
http://localhost:3001/api/mercadopago/callback
https://tu-dominio-sandbox.com/api/mercadopago/callback

Producción:
https://tu-dominio.com/api/mercadopago/callback
```

### 2.3 Configurar Webhooks (Opcional)

Para recibir notificaciones en tiempo real de pagos:

**URL de webhook:**

```
Sandbox: https://tu-dominio-sandbox.com/api/webhooks/mercadopago
Producción: https://tu-dominio.com/api/webhooks/mercadopago
```

**Eventos a notificar:**

- `payment.created`
- `payment.updated`
- `payment.approved`
- `payment.cancelled`
- `payment.refunded`

---

## 🔑 PASO 3: Obtener Credenciales

### 3.1 Credenciales de Producción

En el dashboard de tu aplicación:

1. Ve a **"Credenciales"**
2. **Activa el modo producción** (solo cuando estés listo)
3. Copia las credenciales:

```bash
# Credenciales de PRODUCCIÓN
MP_CLIENT_ID=1234567890123456
MP_CLIENT_SECRET=abcdefghijklmnop
```

### 3.2 Credenciales de Sandbox (Pruebas)

1. En el dashboard, cambia a **"Modo Sandbox"**
2. Copia las credenciales de prueba:

```bash
# Credenciales de SANDBOX
MP_CLIENT_ID=TEST-1234567890123456
MP_CLIENT_SECRET=TEST-abcdefghijklmnop
```

---

## ⚙️ PASO 4: Configurar Variables de Entorno

### 4.1 Archivo `.env.local` en `apps/api/`

Actualiza tu archivo `apps/api/.env.local`:

```bash
# Mercado Pago Configuration
MP_CLIENT_ID=TEST-1234567890123456
MP_CLIENT_SECRET=TEST-abcdefghijklmnop

# Environment (development/production)
NODE_ENV=development
```

### 4.2 Verificar Configuración

Ejecuta este comando para verificar:

```bash
cd apps/api
node -e "console.log('MP_CLIENT_ID:', process.env.MP_CLIENT_ID ? '✅ Configurado' : '❌ Faltante')"
```

---

## 🧪 PASO 5: Probar la Integración

### 5.1 Iniciar el Servidor

```bash
# Desde la raíz del proyecto
npm run dev
```

### 5.2 Probar Conexión OAuth

1. Ve a tu aplicación: `http://localhost:3001/t/[tenant-slug]/finance`
2. Haz clic en **"Conectar Mercado Pago"**
3. Deberías ser redirigido a Mercado Pago
4. Autoriza la aplicación
5. Serás redirigido de vuelta con éxito

### 5.3 Verificar en Base de Datos

```bash
# Conectar a tu base de datos
psql $DATABASE_URL

# Verificar tokens guardados
SELECT * FROM mercadopago_tokens WHERE tenant_id = '[tu-tenant-id]';
```

### 5.4 Probar con Pagos de Prueba

#### Tarjetas de Prueba (Sandbox)

| Tipo      | Número                | Resultado      |
| --------- | --------------------- | -------------- |
| Aprobada  | `5031 4332 1540 6351` | Pago aprobado  |
| Rechazada | `4000 0000 0000 0002` | Pago rechazado |
| Pendiente | `5031 4332 1540 6352` | Pago pendiente |

**Datos adicionales para todas las tarjetas:**

- **Vencimiento:** Cualquier fecha futura (MM/YY)
- **CVV:** 123
- **Nombre:** Cualquier nombre
- **DNI:** 12345678

#### Hacer un Pago de Prueba

1. Crea una orden en tu aplicación
2. Selecciona "Mercado Pago" como método de pago
3. Usa una tarjeta de prueba
4. Completa el pago
5. Verifica que aparezca en el dashboard financiero

---

## 🔍 PASO 6: Verificar Integración Completa

### 6.1 Verificar APIs

```bash
# Verificar estado de conexión
curl -H "Cookie: next-auth.session-token=[tu-token]" \
  http://localhost:3001/api/mercadopago/connect

# Obtener KPIs
curl -H "Cookie: next-auth.session-token=[tu-token]" \
  http://localhost:3001/api/finance/kpis

# Obtener pagos
curl -H "Cookie: next-auth.session-token=[tu-token]" \
  "http://localhost:3001/api/mercadopago/payments?limit=10"
```

### 6.2 Verificar Dashboard

1. Ve al dashboard financiero
2. Deberías ver:
   - ✅ Estado "Conectado" en Mercado Pago
   - ✅ KPIs con datos reales (después de pagos)
   - ✅ Lista de transacciones

### 6.3 Verificar Base de Datos

```sql
-- Verificar estructura de tablas
SELECT tablename FROM pg_tables WHERE tablename LIKE '%mercadopago%';

-- Verificar RLS
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename LIKE '%financial%';

-- Verificar datos
SELECT COUNT(*) FROM mercadopago_payments;
SELECT COUNT(*) FROM financial_movements;
```

---

## 🚀 PASO 7: Ir a Producción

### 7.1 Checklist Pre-Producción

- [ ] Aplicación creada en dashboard de MP
- [ ] Credenciales de producción obtenidas
- [ ] Variables de entorno actualizadas
- [ ] Dominio SSL configurado
- [ ] Webhooks configurados (opcional)
- [ ] Pruebas exhaustivas en sandbox

### 7.2 Cambiar a Modo Producción

```bash
# Actualizar variables de entorno
NODE_ENV=production
MP_CLIENT_ID=1234567890123456  # Credenciales de producción
MP_CLIENT_SECRET=abcdefghijklmnop

# Reiniciar aplicación
npm run build
npm run start
```

### 7.3 Verificar Producción

1. Repite las pruebas del Paso 5
2. Usa tarjetas reales para pagos
3. Verifica que los fondos lleguen a tu cuenta de Mercado Pago

---

## 🐛 Troubleshooting

### Error: "Mercado Pago not connected"

**Solución:**

1. Verifica que `MP_CLIENT_ID` y `MP_CLIENT_SECRET` estén configurados
2. Asegúrate de que la aplicación esté en modo sandbox/producción correcto
3. Revisa que los redirect URIs coincidan exactamente

### Error: "Invalid OAuth access token"

**Solución:**

1. Los tokens expiran cada 6 meses
2. El sistema automáticamente refresca tokens expirados
3. Si falla, desconecta y reconecta la cuenta

### Error: "Payment not found"

**Solución:**

1. Verifica que estés usando credenciales del mismo entorno (sandbox/prod)
2. Asegúrate de que el pago se haya completado exitosamente
3. Revisa los logs del servidor para más detalles

### Pagos no aparecen en dashboard

**Solución:**

1. Verifica conectividad a base de datos
2. Revisa logs de sincronización
3. Fuerza una actualización manual desde el dashboard

---

## 📊 Métricas y Monitoreo

### KPIs a Monitorear

- **Tasa de conversión:** Pagos exitosos / Intentos totales
- **Tasa de aprobación:** Pagos aprobados / Pagos procesados
- **Valor promedio:** Ingreso total / Número de transacciones
- **Tiempo de procesamiento:** Desde checkout hasta confirmación

### Logs Importantes

```bash
# Ver logs de Mercado Pago
grep "mercadopago" logs/application.log

# Ver errores de pago
grep "payment.*error" logs/application.log

# Ver sincronización
grep "sync.*mercadopago" logs/application.log
```

---

## 📞 Soporte

### Recursos Oficiales

- **Documentación Mercado Pago:** [https://www.mercadopago.com.mx/developers](https://www.mercadopago.com.mx/developers)
- **Dashboard Desarrolladores:** [https://developers.mercadopago.com/dashboard](https://developers.mercadopago.com/dashboard)
- **Comunidad:** [https://www.mercadopago.com.mx/comunidad](https://www.mercadopago.com.mx/comunidad)

### Contacto Soporte

- **Email:** developers@mercadopago.com
- **Teléfono:** 55 1234 5678 (México)
- **Chat en vivo:** Disponible en dashboard de desarrolladores

---

## ✅ Checklist Final

- [ ] Cuenta de Mercado Pago creada y verificada
- [ ] Aplicación registrada en dashboard de desarrolladores
- [ ] Credenciales OAuth configuradas correctamente
- [ ] Variables de entorno actualizadas
- [ ] Redirect URIs configurados
- [ ] Integración probada en sandbox
- [ ] Dashboard financiero muestra datos reales
- [ ] Base de datos recibe y procesa pagos
- [ ] Webhooks configurados (opcional)
- [ ] Pruebas de stress realizadas
- [ ] Documentación de procesos actualizada

---

**🎉 ¡Tu integración con Mercado Pago está lista!**

Ahora puedes procesar pagos reales y tener un dashboard financiero completo con datos actualizados en tiempo real.
