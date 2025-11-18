FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy service code
COPY . .

EXPOSE 5000

CMD ["npm", "start"]
