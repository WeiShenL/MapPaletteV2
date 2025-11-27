FROM node:18-alpine

WORKDIR /app

# Copy entire backend
COPY . .

# Install shared dependencies and generate Prisma
WORKDIR /app/shared
RUN npm install
RUN npx prisma generate || true

# Install service dependencies
WORKDIR /app/services/atomic/user-service
RUN npm install --production

EXPOSE 5000

CMD ["npm", "start"]
