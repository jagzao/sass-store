# Dockerfile para SASS Store
# Construcción multi-etapa para optimizar el tamaño de la imagen

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

# Construir la aplicación
RUN npm run build

# Etapa 2: Imagen de producción
FROM node:18-alpine AS runner

# Instalar dependencias necesarias para la ejecución
RUN npm install -g serve

# Crear directorio de la aplicación
WORKDIR /app

# Copiar los archivos construidos desde la etapa de construcción
COPY --from=builder /app/apps/web/out ./web
COPY --from=builder /app/apps/api/.next/standalone ./api
COPY --from=builder /app/apps/api/public ./api/public
COPY --from=builder /app/apps/api/.next/static ./api/.next/static

# Exponer puertos
EXPOSE 3001 4000

# Comando para iniciar la aplicación
CMD ["sh", "-c", "cd api && node server.js & cd ../web && serve -s out -l 3001"]