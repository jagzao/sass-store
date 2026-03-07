# Dockerfile para SASS Store
# Construcción multi-etapa para optimizar el tamaño de la imagen
# Monolith-only: apps/web contains all API routes

# Etapa 1: Construir la aplicación
FROM node:18-alpine AS builder

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración del paquete
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar el resto del código fuente
COPY . .

# Construir la aplicación (monolith web app with API routes)
RUN npm run build

# Etapa 2: Imagen de producción
FROM node:18-alpine AS runner

# Instalar dependencias necesarias para la ejecución
RUN npm install -g serve

# Crear directorio de la aplicación
WORKDIR /app

# Copiar los archivos construidos desde la etapa de construcción
COPY --from=builder /app/apps/web/out ./web

# Exponer puerto (monolith-only, single port)
EXPOSE 3001

# Comando para iniciar la aplicación
CMD ["serve", "-s", "web", "-l", "3001"]
