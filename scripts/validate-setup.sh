#!/bin/bash
# ============================================
# MapPaletteV2 Setup Validation Script
# ============================================
# Validates all prerequisites before starting
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
ERRORS=0
WARNINGS=0

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    ERRORS=$((ERRORS + 1))
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   MapPaletteV2 Setup Validation       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check Docker
log_info "Checking Docker installation..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
    log_success "Docker is installed (version $DOCKER_VERSION)"

    # Check minimum version (20.10+)
    MAJOR=$(echo $DOCKER_VERSION | cut -d'.' -f1)
    MINOR=$(echo $DOCKER_VERSION | cut -d'.' -f2)

    if [ "$MAJOR" -lt 20 ] || ([ "$MAJOR" -eq 20 ] && [ "$MINOR" -lt 10 ]); then
        log_warning "Docker version is older than 20.10. Consider upgrading."
    fi
else
    log_error "Docker is not installed. Please install Docker 20.10 or later."
fi

# Check Docker Compose
log_info "Checking Docker Compose..."
if docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version --short)
    log_success "Docker Compose is installed (version $COMPOSE_VERSION)"
else
    log_error "Docker Compose is not installed or not available as 'docker compose'"
fi

# Check Docker daemon
log_info "Checking if Docker daemon is running..."
if docker info &> /dev/null; then
    log_success "Docker daemon is running"
else
    log_error "Docker daemon is not running. Please start Docker."
fi

# Check disk space (need at least 10GB)
log_info "Checking available disk space..."
AVAILABLE_SPACE=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
if [ "$AVAILABLE_SPACE" -ge 10 ]; then
    log_success "Available disk space: ${AVAILABLE_SPACE}GB"
else
    log_warning "Low disk space: ${AVAILABLE_SPACE}GB available. Recommended: 10GB+"
fi

# Check .env file
log_info "Checking .env file..."
if [ -f .env ]; then
    log_success ".env file exists"

    # Load .env
    source .env

    # Check critical variables
    log_info "Validating environment variables..."

    if [ "$POSTGRES_PASSWORD" = "your-super-secret-password-change-me" ]; then
        log_warning "POSTGRES_PASSWORD is still set to default value"
    else
        log_success "POSTGRES_PASSWORD is configured"
    fi

    if [ "$JWT_SECRET" = "your-super-secret-jwt-secret-change-me-at-least-32-characters" ]; then
        log_warning "JWT_SECRET is still set to default value"
    else
        # Check length
        if [ ${#JWT_SECRET} -lt 32 ]; then
            log_error "JWT_SECRET must be at least 32 characters long (current: ${#JWT_SECRET})"
        else
            log_success "JWT_SECRET is configured (length: ${#JWT_SECRET})"
        fi
    fi

    if [ -z "$GOOGLE_MAPS_API_KEY" ] || [ "$GOOGLE_MAPS_API_KEY" = "your-google-maps-api-key-here" ]; then
        log_warning "GOOGLE_MAPS_API_KEY not configured (map features will not work)"
    else
        log_success "GOOGLE_MAPS_API_KEY is configured"
    fi

    if [ -z "$INTERNAL_SERVICE_KEY" ] || [ "$INTERNAL_SERVICE_KEY" = "change-me-to-a-random-string-use-openssl-rand-hex-32" ]; then
        log_warning "INTERNAL_SERVICE_KEY not configured"
    else
        log_success "INTERNAL_SERVICE_KEY is configured"
    fi

else
    log_error ".env file does not exist. Run: cp .env.example .env"
fi

# Check required ports
log_info "Checking if required ports are available..."
REQUIRED_PORTS=(80 443 3000 3001 3002 3003 3004 3005 3006 3007 3008 3009 3010 5000 5432 6379 8000 8081)
for PORT in "${REQUIRED_PORTS[@]}"; do
    if lsof -Pi :$PORT -sTCP:LISTEN -t &> /dev/null ; then
        log_warning "Port $PORT is already in use"
    fi
done

# Check Node.js (for local development)
log_info "Checking Node.js installation (optional for local dev)..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log_success "Node.js is installed ($NODE_VERSION)"

    # Check version (need 18+)
    MAJOR=$(echo $NODE_VERSION | sed 's/v//' | cut -d'.' -f1)
    if [ "$MAJOR" -lt 18 ]; then
        log_warning "Node.js version is older than 18. Consider upgrading for local development."
    fi
else
    log_info "Node.js not installed (not required for Docker setup)"
fi

# Check Git
log_info "Checking Git installation..."
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version | cut -d' ' -f3)
    log_success "Git is installed (version $GIT_VERSION)"
else
    log_warning "Git is not installed (recommended but not required)"
fi

# Check required files exist
log_info "Checking required files..."
REQUIRED_FILES=(
    "docker-compose.yml"
    "Caddyfile"
    "supabase/kong.yml"
    "supabase/volumes/db/init/00-initial-schema.sql"
    "supabase/volumes/db/init/01-roles.sql"
    "supabase/volumes/db/init/02-storage.sql"
    "supabase/volumes/db/init/03-realtime.sql"
    "supabase/volumes/db/init/99-roles.sql"
    "backend/shared/prisma/schema.prisma"
)

for FILE in "${REQUIRED_FILES[@]}"; do
    if [ -f "$FILE" ]; then
        log_success "$FILE exists"
    else
        log_error "$FILE is missing"
    fi
done

# Summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Validation Summary             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! You're ready to start.${NC}"
    echo ""
    echo "Run: ./setup.sh or ./scripts/init-docker.sh"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s) found, but you can proceed.${NC}"
    echo ""
    echo "Run: ./setup.sh or ./scripts/init-docker.sh"
    exit 0
else
    echo -e "${RED}✗ $ERRORS error(s) and $WARNINGS warning(s) found.${NC}"
    echo ""
    echo "Please fix the errors above before proceeding."
    exit 1
fi
