FROM node:18-alpine

WORKDIR /app

# package files
COPY package*.json ./

# install dependencies
RUN npm ci --only=production

# cpy app files
COPY . .

# start the application
CMD ["node", "src/index.js"]