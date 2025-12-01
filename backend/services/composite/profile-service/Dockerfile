FROM node:22-alpine

# Install OpenSSL and libc for Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy root .env for Prisma configuration
COPY .env ./

# Copy entire backend monorepo (needed for npm workspaces)
COPY backend/package*.json ./
COPY backend/shared ./shared
COPY backend/services ./services

COPY backend/shared/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Install all workspace dependencies at once
# Skip Prisma postinstall during npm install to avoid network issues
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
ENV NODE_PATH=/app/node_modules
RUN npm install --production=false

# Set working directory to this specific service
WORKDIR /app/services/composite/profile-service

EXPOSE 5000

# Use entrypoint script that generates Prisma Client before starting
ENTRYPOINT ["docker-entrypoint.sh"]