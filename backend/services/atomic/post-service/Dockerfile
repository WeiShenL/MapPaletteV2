FROM node:18-alpine

# Install OpenSSL and libc for Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy entire backend
COPY . .

# Install shared dependencies and generate Prisma
WORKDIR /app/shared
RUN npm install
RUN npx prisma generate || true

# Install service dependencies
WORKDIR /app/services/atomic/post-service
RUN npm install --production

EXPOSE 5000

CMD ["npm", "start"]
