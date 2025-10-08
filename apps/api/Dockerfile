FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build --workspace=@sass-store/api

EXPOSE 3001

CMD ["npm", "start", "--workspace=@sass-store/api"]