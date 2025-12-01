FROM node:22-alpine

# Install OpenSSL and libc for Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy entire backend monorepo (needed for npm workspaces)
COPY backend/package*.json ./
COPY backend/shared ./shared
COPY backend/services ./services

# Install all workspace dependencies at once
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate --schema=./shared/prisma/schema.prisma

# Set working directory to this specific service
WORKDIR /app/services/composite/feed-service

EXPOSE 5000

# npm start will run the script from package.json in current service
CMD ["npm", "start"]
