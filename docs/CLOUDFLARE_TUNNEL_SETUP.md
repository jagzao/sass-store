# Configuración de Cloudflare Tunnel para SASS Store

Este documento explica cómo configurar Cloudflare Tunnel para exponer tu aplicación SASS Store a internet de forma segura.

## Requisitos Previos

1. Una cuenta de Cloudflare (puedes crear una gratuita en [cloudflare.com](https://cloudflare.com))
2. Un dominio configurado en Cloudflare
3. Docker y Docker Compose instalados en tu sistema

## Paso 1: Crear el Túnel en Cloudflare

1. Inicia sesión en tu cuenta de [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Selecciona el dominio que quieres usar para el túnel
3. Ve a "Access" > "Tunnels" en el menú de la izquierda
4. Haz clic en "Create tunnel"
5. Asigna un nombre a tu túnel, por ejemplo: "sass-store-tunnel"
6. Selecciona "Cloudflared" como el tipo de túnel
7. Sigue las instrucciones para instalar y configurar el túnel

## Paso 2: Obtener el Token del Túnel

Después de crear el túnel, Cloudflare te proporcionará un token. Copia este token, ya que lo necesitarás para la configuración de Docker.

El token se verá algo así:
```
TUNNEL_TOKEN=eyJhIjoiMzYxZGQ1YzI...
```

## Paso 3: Configurar el Archivo .env

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```bash
# Token del túnel de Cloudflare
TUNNEL_TOKEN=tu_token_de_tunel_aqui
```

Reemplaza `tu_token_de_tunel_aqui` con el token que obtuviste en el paso anterior.

## Paso 4: Configurar las Rutas del Túnel

En el dashboard de Cloudflare, después de crear el túnel, necesitas configurar las rutas:

1. Haz clic en el nombre de tu túnel
2. Ve a la sección "Public Hostname"
3. Haz clic en "Add a public hostname"
4. Configura las siguientes rutas:

### Ruta para la Aplicación Web
- **Subdomain**: `app` (o el que prefieras)
- **Domain**: Tu dominio (ej: `tudominio.com`)
- **Path**: `/`
- **Service**: `http`
- **URL**: `sass-store-app:3001`

### Ruta para la API
- **Subdomain**: `api` (o el que prefieras)
- **Domain**: Tu dominio (ej: `tudominio.com`)
- **Path**: `/`
- **Service**: `http`
- **URL**: `sass-store-app:4000`

## Paso 5: Iniciar los Contenedores

En la raíz del proyecto, ejecuta:

```bash
# Construir e iniciar los contenedores
docker-compose up --build -d
```

## Paso 6: Verificar el Funcionamiento

Después de iniciar los contenedores, deberías poder acceder a tu aplicación a través de las URLs que configuraste:

- **Aplicación Web**: `https://app.tudominio.com`
- **API**: `https://api.tudominio.com`

## Paso 7: Verificar los Logs

Para verificar que todo está funcionando correctamente, puedes revisar los logs:

```bash
# Ver logs de la aplicación
docker-compose logs sass-store

# Ver logs del túnel
docker-compose logs cloudflared
```

## Solución de Problemas

### Problemas Comunes

1. **Error de conexión con la base de datos**: Asegúrate de que la URL de la base de datos en el archivo docker-compose.yml sea correcta y accesible desde el contenedor.

2. **Error de token del túnel**: Verifica que el token en el archivo .env sea correcto y no tenga espacios adicionales.

3. **Error de DNS**: Asegúrate de que tu dominio esté correctamente configurado en Cloudflare y que los registros DNS apunten a los servidores de Cloudflare.

### Reiniciar los Servicios

Si necesitas reiniciar los servicios:

```bash
# Detener los contenedores
docker-compose down

# Iniciar los contenedores nuevamente
docker-compose up -d
```

### Actualizar la Aplicación

Si realizas cambios en el código y necesitas actualizar la aplicación:

```bash
# Reconstruir e iniciar los contenedores
docker-compose up --build -d
```

## Seguridad Adicional

Para mayor seguridad, considera:

1. Configurar reglas de acceso en Cloudflare Access para restringir quién puede acceder a tu aplicación
2. Habilitar WAF (Web Application Firewall) en Cloudflare
3. Configurar SSL/TLS completo en Cloudflare