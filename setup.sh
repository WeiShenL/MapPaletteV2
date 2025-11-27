#!/bin/bash

# MapPaletteV2 - Complete Setup Script
# This script sets up the entire application from scratch

set -e

echo "🚀 MapPaletteV2 Setup Starting..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Copying from .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}❗ Please edit .env file with your values before continuing!${NC}"
    echo -e "${YELLOW}Run this script again after editing .env${NC}"
    exit 1
fi

echo -e "${GREEN}✅ .env file found${NC}"

# Install shared dependencies
echo "📦 Installing shared dependencies..."
cd backend/shared
npm install
echo -e "${GREEN}✅ Shared dependencies installed${NC}"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate
echo -e "${GREEN}✅ Prisma client generated${NC}"

# Go back to root
cd ../..

# Create initial migration
echo "🗄️  Creating database migration..."
cd backend/shared
npx prisma migrate dev --name init
echo -e "${GREEN}✅ Database migration created${NC}"

cd ../..

# Build all Docker images
echo "🐳 Building Docker images..."
docker compose build
echo -e "${GREEN}✅ Docker images built${NC}"

# Start services
echo "🚀 Starting services..."
docker compose up -d
echo -e "${GREEN}✅ Services started${NC}"

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run migrations in production
echo "🗄️  Running database migrations..."
docker compose exec user-service sh -c "cd /app/shared && npx prisma migrate deploy"
echo -e "${GREEN}✅ Migrations complete${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 MapPaletteV2 Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "📍 Access points:"
echo "   - Frontend:  http://localhost:3000"
echo "   - API:       http://localhost:8080/api"
echo "   - Supabase:  http://localhost:8000"
echo "   - Database:  localhost:5432"
echo "   - Redis:     localhost:6379"
echo ""
echo "📊 Useful commands:"
echo "   - View logs:    docker compose logs -f [service-name]"
echo "   - Stop:         docker compose down"
echo "   - Restart:      docker compose restart"
echo "   - Destroy all:  docker compose down -v"
echo ""
echo -e "${YELLOW}⚠️  Don't forget to:${NC}"
echo "   1. Update your frontend .env with Supabase URLs"
echo "   2. Create your first user via Supabase Auth"
echo "   3. Test the application"
echo ""
