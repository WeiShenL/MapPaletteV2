#!/bin/bash

# MapPaletteV2 - Quick Setup Script
# This script provides a simple entry point for setting up the application
# It validates prerequisites and then runs the Docker initialization script

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   MapPaletteV2 Quick Setup             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if validation script exists
if [ ! -f scripts/validate-setup.sh ]; then
    echo -e "${YELLOW}⚠️  Validation script not found. Skipping validation...${NC}"
else
    echo -e "${BLUE}Running prerequisite validation...${NC}"
    echo ""
    ./scripts/validate-setup.sh
    VALIDATION_RESULT=$?

    if [ $VALIDATION_RESULT -ne 0 ]; then
        echo ""
        echo -e "${RED}Validation failed. Please fix the errors above.${NC}"
        exit 1
    fi
    echo ""
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Review and update .env file with your values:${NC}"
    echo "   - POSTGRES_PASSWORD (change from default)"
    echo "   - JWT_SECRET (generate with: openssl rand -base64 32)"
    echo "   - GOOGLE_MAPS_API_KEY (get from Google Cloud Console)"
    echo "   - INTERNAL_SERVICE_KEY (generate with: openssl rand -hex 32)"
    echo ""
    echo "After updating .env, run this script again."
    exit 1
fi

echo -e "${GREEN}✅ .env file exists${NC}"
echo ""

# Ask user if they want to proceed
echo -e "${BLUE}This will:${NC}"
echo "  1. Stop and remove existing containers"
echo "  2. Build Docker images"
echo "  3. Start all services (Supabase, Redis, Backend, Frontend)"
echo "  4. Run database migrations"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}Starting Docker initialization...${NC}"
echo ""

# Run the Docker initialization script
if [ -f scripts/init-docker.sh ]; then
    ./scripts/init-docker.sh
else
    echo -e "${RED}Error: scripts/init-docker.sh not found${NC}"
    echo "Please ensure all required files are present."
    exit 1
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Setup Complete! 🎉                 ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Open http://localhost:3000 to access the frontend"
echo "  2. Open http://localhost:8081 to access Supabase Studio"
echo "  3. Create your first user via the signup page"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "  - View logs:    docker compose logs -f [service-name]"
echo "  - Stop:         docker compose down"
echo "  - Restart:      docker compose restart [service-name]"
echo "  - Clean reset:  docker compose down -v"
echo ""
