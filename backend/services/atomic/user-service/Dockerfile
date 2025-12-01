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

ENV PRISMA_FORCE_NAPI=1

# Install all workspace dependencies at once
# Skip Prisma postinstall during npm install to avoid network issues
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
RUN npm install --production=false || npm install --production=false || npm install --production=false
RUN npx prisma generate --schema shared/prisma/schema.prisma

# Set working directory to this specific service
WORKDIR /app/services/atomic/user-service

EXPOSE 5000

# Use npm start directly
RUN env
CMD ["npm", "start"]
