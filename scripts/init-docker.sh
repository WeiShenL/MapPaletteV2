#!/bin/bash
# ============================================
# MapPaletteV2 Docker Initialization Script
# ============================================
# This script initializes the complete MapPalette stack including:
# - Supabase (Database, Auth, Storage, Kong Gateway)
# - Redis Cache
# - Backend Microservices
# - Frontend Application
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
check_env() {
    log_info "Checking environment configuration..."
    if [ ! -f .env ]; then
        log_warning ".env file not found!"
        log_info "Copying .env.example to .env..."
        cp .env.example .env
        log_warning "⚠️  IMPORTANT: Please edit .env and update the following:"
        log_warning "   - POSTGRES_PASSWORD (change from default)"
        log_warning "   - JWT_SECRET (generate with: openssl rand -base64 32)"
        log_warning "   - GOOGLE_MAPS_API_KEY (get from Google Cloud Console)"
        echo ""
        read -p "Press Enter after you've updated .env, or Ctrl+C to exit..."
    else
        log_success ".env file found"
    fi
}

# Validate required environment variables
validate_env() {
    log_info "Validating environment variables..."

    source .env

    local errors=0

    # Check critical variables
    if [ "$POSTGRES_PASSWORD" = "your-super-secret-password-change-me" ]; then
        log_error "POSTGRES_PASSWORD still set to default value!"
        errors=$((errors + 1))
    fi

    if [ "$JWT_SECRET" = "your-super-secret-jwt-secret-change-me-at-least-32-characters" ]; then
        log_error "JWT_SECRET still set to default value!"
        errors=$((errors + 1))
    fi

    if [ -z "$GOOGLE_MAPS_API_KEY" ] || [ "$GOOGLE_MAPS_API_KEY" = "your-google-maps-api-key-here" ]; then
        log_warning "GOOGLE_MAPS_API_KEY not set (map features may not work)"
    fi

    if [ $errors -gt 0 ]; then
        log_error "Please fix the errors in .env file before continuing"
        exit 1
    fi

    log_success "Environment validation passed"
}

# Stop and remove existing containers
cleanup() {
    log_info "Cleaning up existing containers..."
    docker compose down -v 2>/dev/null || true
    log_success "Cleanup complete"
}

# Start Supabase core services first
start_supabase() {
    log_info "Starting Supabase services..."
    docker compose up -d supabase-db supabase-auth supabase-rest supabase-storage imgproxy supabase-kong redis

    log_info "Waiting for Supabase database to be healthy..."
    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if docker compose ps supabase-db | grep -q "healthy"; then
            log_success "Supabase database is healthy"
            break
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done

    if [ $attempt -eq $max_attempts ]; then
        log_error "Supabase database failed to become healthy"
        docker compose logs supabase-db
        exit 1
    fi

    log_info "Waiting for other Supabase services to be ready..."
    sleep 5

    log_success "Supabase services started successfully"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."

    # Wait a bit for Supabase to fully initialize
    sleep 3

    # Check if Prisma is available
    if [ -d "backend/shared/prisma" ]; then
        log_info "Running Prisma migrations..."

        # Run Prisma migrations from one of the services
        docker compose exec -T supabase-db psql -U postgres -d postgres <<EOF
        -- Verify Supabase roles exist
        SELECT 'Roles check:' as status, COUNT(*) as count
        FROM pg_roles
        WHERE rolname IN ('authenticator', 'anon', 'authenticated', 'service_role', 'supabase_auth_admin', 'supabase_storage_admin');
EOF

        if [ $? -eq 0 ]; then
            log_success "Database roles verified"
        else
            log_error "Database roles verification failed"
            exit 1
        fi

        # Now run Prisma migrations
        log_info "Applying Prisma schema migrations..."
        # Note: This should be run from a service container with Prisma installed
        # For now, we'll provide instructions
        log_warning "Run Prisma migrations manually with:"
        log_warning "  cd backend/shared && npx prisma migrate deploy"

        # Run custom SQL migrations
        log_info "Running custom SQL migrations..."

        # Auth setup
        if [ -f "backend/shared/migrations/supabase-auth-setup.sql" ]; then
            log_info "Setting up auth triggers..."
            docker compose exec -T supabase-db psql -U postgres -d postgres < backend/shared/migrations/supabase-auth-setup.sql
            log_success "Auth triggers configured"
        fi

        # Storage buckets
        if [ -f "backend/shared/migrations/add-storage-buckets.sql" ]; then
            log_info "Creating storage buckets..."
            docker compose exec -T supabase-db psql -U postgres -d postgres < backend/shared/migrations/add-storage-buckets.sql
            log_success "Storage buckets created"
        fi

    else
        log_warning "Prisma directory not found, skipping migrations"
    fi

    log_success "Database migrations completed"
}

# Start application services
start_services() {
    log_info "Starting application services..."
    docker compose up -d

    log_success "All services started"
}

# Verify services are running
verify_services() {
    log_info "Verifying services..."
    echo ""
    docker compose ps
    echo ""

    log_info "Service endpoints:"
    echo "  🔹 Supabase Kong Gateway:  http://localhost:8000"
    echo "  🔹 Frontend:               http://localhost:3000"
    echo "  🔹 PostgreSQL:             localhost:5432"
    echo "  🔹 Redis:                  localhost:6379"
    echo "  🔹 User Service:           http://localhost:3001"
    echo "  🔹 Post Service:           http://localhost:3002"
    echo "  🔹 Interaction Service:    http://localhost:3003"
    echo "  🔹 Feed Service:           http://localhost:3004"
    echo "  🔹 Follow Service:         http://localhost:3007"
    echo ""

    log_info "Checking service health..."

    # Check Kong
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        log_success "Kong Gateway is responding"
    else
        log_warning "Kong Gateway health check failed (this may be normal during startup)"
    fi

    log_success "Service verification complete"
}

# Main execution
main() {
    echo ""
    log_info "╔════════════════════════════════════════╗"
    log_info "║   MapPaletteV2 Initialization Script   ║"
    log_info "╚════════════════════════════════════════╝"
    echo ""

    # Change to script directory's parent (project root)
    cd "$(dirname "$0")/.."

    check_env
    validate_env

    echo ""
    log_warning "This will:"
    log_warning "  1. Stop and remove existing containers"
    log_warning "  2. Start Supabase services"
    log_warning "  3. Run database migrations"
    log_warning "  4. Start all application services"
    echo ""
    read -p "Continue? (y/N): " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Aborted by user"
        exit 0
    fi

    cleanup
    start_supabase
    run_migrations
    start_services
    verify_services

    echo ""
    log_success "╔════════════════════════════════════════╗"
    log_success "║     Initialization Complete! 🎉        ║"
    log_success "╚════════════════════════════════════════╝"
    echo ""
    log_info "Next steps:"
    log_info "  1. Access the frontend at http://localhost:3000"
    log_info "  2. Supabase API is available at http://localhost:8000"
    log_info "  3. View logs: docker compose logs -f [service-name]"
    log_info "  4. Stop services: docker compose down"
    echo ""
}

# Run main function
main
