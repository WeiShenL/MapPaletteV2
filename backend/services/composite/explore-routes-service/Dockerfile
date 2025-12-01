FROM node:22-alpine

# Install OpenSSL and libc for Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy root .env for Prisma configuration
COPY .env ./

# Copy entire backend monorepo (needed for npm workspaces)
COPY backend/package*.json ./
COPY backend/prisma.config.ts ./
COPY backend/shared ./shared
COPY backend/services ./services

# Install all workspace dependencies at once
RUN npm install --production=false

# Set working directory to this specific service
WORKDIR /app/services/composite/explore-routes-service

EXPOSE 5000

# npm start will run the script from package.json in current service
CMD ["npm", "start"]