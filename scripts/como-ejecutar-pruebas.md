# Cómo Ejecutar Pruebas del Sistema de Fechas de Retoque

## Introducción

Este documento explica cómo ejecutar las pruebas para validar el sistema de fechas de retoque configurable. Las pruebas están diseñadas para verificar que todas las funcionalidades implementadas funcionen correctamente.

## Tipos de Pruebas Disponibles

### 1. Pruebas Unitarias del Backend

Estas pruebas verifican la lógica de cálculo de fechas en el servicio `RetouchService`.

#### Ejecución:

```bash
# Ejecutar pruebas unitarias del servicio de fechas de retoque
npm run test:unit -- --testPathPattern=retouch-service
```

### 2. Pruebas de Integración de la API

Estas pruebas verifican que los endpoints HTTP del sistema de fechas de retoque funcionen correctamente.

#### Ejecución:

```bash
# Ejecutar pruebas de integración de los endpoints API
npm run test:integration -- --testPathPattern=retouch
```

### 3. Pruebas End-to-End (E2E)

Estas pruebas verifican el flujo completo desde la interfaz de usuario.

#### Ejecución:

```bash
# Ejecutar pruebas E2E del sistema de fechas de retoque
npm run test:e2e -- --testPathPattern=retouch
```

### 4. Pruebas Completas del Sistema

Ejecuta todas las pruebas relacionadas con el sistema de fechas de retoque.

#### Ejecución:

```bash
# Ejecutar todas las pruebas del sistema de fechas de retoque
npm run test:retouch
```

## Prueba Manual del Sistema

Si prefieres probar el sistema manualmente, sigue estos pasos:

### 1. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

### 2. Acceder al Sistema de Fechas de Retoque

Abre tu navegador y navega a:

```
http://localhost:3001/t/[tenant]/retouch
```

Reemplaza `[tenant]` con el slug de tu tenant (ej: `zo-system`).

### 3. Probar las Funcionalidades

#### a. Ver Lista de Clientes

- La lista debe mostrar los clientes ordenados por fecha de retoque
- Verifica que se muestren correctamente las fechas de próximo retoque
- Comprueba los indicadores visuales de estado (atrasado, próximo, normal)

#### b. Configurar Frecuencias de Retoque

1. Ve a la pestaña "Configuración"
2. Crea una nueva configuración de retoque:
   - Selecciona un servicio
   - Define la frecuencia (días, semanas, meses)
   - Establece el valor numérico
   - Marca si considera solo días hábiles
3. Guarda la configuración

#### c. Gestionar Días Festivos

1. Ve a la pestaña "Días Festivos"
2. Agrega un nuevo día festivo:
   - Ingresa un nombre descriptivo
   - Selecciona una fecha
   - Marca si es recurrente
   - Indica si afecta el cálculo de fechas de retoque
3. Guarda el día festivo

#### d. Actualizar Fechas de Retoque

1. En la lista de clientes, busca un cliente con visitas completadas
2. Haz clic en el botón para actualizar su fecha de retoque
3. Verifica que la fecha se calcule correctamente según la configuración

### 4. Verificar Cálculos Manuales

Puedes verificar manualmente los cálculos de fechas con estos ejemplos:

#### Ejemplo 1: Servicio de Uñas (15 días, sin días libres)

- Última visita: 2026-01-10
- Frecuencia: 15 días
- Próximo retoque: 2026-01-25

#### Ejemplo 2: Servicio de Estética (30 días, solo días hábiles)

- Última visita: 2026-01-10
- Frecuencia: 30 días
- Días hábiles: true
- Próximo retoque: 2026-02-20 (aproximado, saltando fines de semana)

#### Ejemplo 3: Considerando Días Festivos

- Última visita: 2026-01-10
- Frecuencia: 15 días
- Día festivo: 2026-01-25
- Próximo retoque: 2026-01-26 (un día después por el festivo)

## Script de Prueba Automatizado

También puedes ejecutar el script de prueba automatizado:

```bash
# Instalar tsx si no lo tienes instalado
npm install -g tsx

# Ejecutar el script de prueba
tsx scripts/test-retouch-api.ts
```

**Nota**: Antes de ejecutar el script, asegúrate de:

1. Tener el servidor de desarrollo corriendo (`npm run dev`)
2. Tener datos de prueba en la base de datos
3. Reemplazar los IDs de prueba en el script con IDs válidos de tu base de datos

## Verificación de Resultados

### Pruebas Exitosas

- Todas las APIs retornan status code 200
- Las fechas de retoque se calculan correctamente
- La interfaz muestra los datos sin errores
- Las configuraciones se guardan y recuperan correctamente

### Problemas Comunes

1. **Error de conexión**: Asegúrate que el servidor esté corriendo
2. **IDs inválidos**: Reemplaza los IDs de prueba con IDs válidos
3. **Permisos**: Asegúrate de tener permisos de administrador
4. **Datos faltantes**: Verifica que tengas clientes, servicios y visitas en la base de datos

## Reporte de Problemas

Si encuentras algún problema durante las pruebas:

1. Captura una pantalla del error
2. Copia el mensaje de error exacto
3. Anota los pasos que seguiste
4. Reporta el problema con esta información

## Conclusión

Estas pruebas aseguran que el sistema de fechas de retoque configurable funcione correctamente antes de su deployment. Es importante ejecutar todas las pruebas y verificar que los resultados sean los esperados.
