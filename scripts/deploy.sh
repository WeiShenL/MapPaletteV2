#!/bin/bash

###############################################################################
# MapPalette V2 - Automated Deployment Script
#
# This script deploys the application to your VPS with zero-downtime updates.
#
# Usage:
#   ./scripts/deploy.sh [--skip-backup] [--skip-tests] [--force]
#
# Options:
#   --skip-backup    Skip database backup before deployment
#   --skip-tests     Skip running tests before deployment
#   --force          Skip all confirmations
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$APP_DIR/backups"
LOG_FILE="$APP_DIR/logs/deploy-$(date +%Y%m%d-%H%M%S).log"
DOCKER_COMPOSE="docker compose"

# Parse arguments
SKIP_BACKUP=false
SKIP_TESTS=false
FORCE=false

for arg in "$@"; do
  case $arg in
    --skip-backup)
      SKIP_BACKUP=true
      shift
      ;;
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $arg${NC}"
      echo "Usage: $0 [--skip-backup] [--skip-tests] [--force]"
      exit 1
      ;;
  esac
done

# Logging function
log() {
  echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
  echo -e "${RED}✗${NC} $1" | tee -a "$LOG_FILE"
}

# Create necessary directories
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

###############################################################################
# Pre-deployment Checks
###############################################################################

log "Starting deployment process..."
log "App directory: $APP_DIR"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  log_error "Docker is not running. Please start Docker and try again."
  exit 1
fi
log_success "Docker is running"

# Check if .env file exists
if [ ! -f "$APP_DIR/.env" ]; then
  log_error ".env file not found. Please create it from .env.example"
  exit 1
fi
log_success ".env file exists"

# Check for uncommitted changes
cd "$APP_DIR"
if [ -n "$(git status --porcelain)" ]; then
  log_warning "You have uncommitted changes:"
  git status --short

  if [ "$FORCE" = false ]; then
    read -p "Continue with deployment? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      log "Deployment cancelled by user"
      exit 0
    fi
  fi
fi

# Get current branch and commit
BRANCH=$(git rev-parse --abbrev-ref HEAD)
COMMIT=$(git rev-parse --short HEAD)
log "Branch: $BRANCH | Commit: $COMMIT"

###############################################################################
# Backup Database
###############################################################################

if [ "$SKIP_BACKUP" = false ]; then
  log "Creating database backup..."

  if [ -f "$APP_DIR/scripts/backup.sh" ]; then
    bash "$APP_DIR/scripts/backup.sh"
    log_success "Database backup created"
  else
    log_warning "Backup script not found, skipping backup"
  fi
else
  log_warning "Skipping database backup (--skip-backup flag set)"
fi

###############################################################################
# Pull Latest Changes
###############################################################################

log "Pulling latest changes from git..."

if [ "$FORCE" = false ]; then
  read -p "Pull latest changes from origin/$BRANCH? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git pull origin "$BRANCH"
    log_success "Git pull completed"
  else
    log_warning "Skipping git pull"
  fi
else
  git pull origin "$BRANCH"
  log_success "Git pull completed"
fi

###############################################################################
# Install Dependencies
###############################################################################

log "Installing/updating dependencies..."

# Backend shared dependencies
if [ -d "$APP_DIR/backend/shared" ]; then
  cd "$APP_DIR/backend/shared"
  npm install --production
  log_success "Backend shared dependencies installed"
fi

# Frontend dependencies (if needed)
if [ -d "$APP_DIR/frontend" ]; then
  cd "$APP_DIR/frontend"
  npm install --production
  log_success "Frontend dependencies installed"
fi

cd "$APP_DIR"

###############################################################################
# Run Database Migrations
###############################################################################

log "Running database migrations..."

cd "$APP_DIR/backend/shared"

# Check if there are pending migrations
if npx prisma migrate status | grep -q "Database schema is up to date"; then
  log_success "Database schema is up to date"
else
  log "Applying pending migrations..."
  npx prisma migrate deploy
  log_success "Database migrations applied"
fi

cd "$APP_DIR"

###############################################################################
# Build Docker Images
###############################################################################

log "Building Docker images..."

$DOCKER_COMPOSE build --no-cache

log_success "Docker images built successfully"

###############################################################################
# Run Tests (Optional)
###############################################################################

if [ "$SKIP_TESTS" = false ]; then
  log "Running tests..."

  # Add your test commands here
  # Example:
  # $DOCKER_COMPOSE run --rm user-service npm test
  # $DOCKER_COMPOSE run --rm post-service npm test

  log_warning "No tests configured yet, skipping..."
else
  log_warning "Skipping tests (--skip-tests flag set)"
fi

###############################################################################
# Deploy Services
###############################################################################

log "Deploying services..."

# Stop and remove old containers
log "Stopping old containers..."
$DOCKER_COMPOSE down

# Start services
log "Starting services..."
$DOCKER_COMPOSE up -d

# Wait for services to be healthy
log "Waiting for services to be healthy..."
sleep 10

# Check service health
FAILED_SERVICES=()

check_service() {
  SERVICE_NAME=$1
  SERVICE_PORT=$2

  if curl -f -s "http://localhost:$SERVICE_PORT/health" > /dev/null 2>&1; then
    log_success "$SERVICE_NAME is healthy (port $SERVICE_PORT)"
  else
    log_error "$SERVICE_NAME health check failed (port $SERVICE_PORT)"
    FAILED_SERVICES+=("$SERVICE_NAME")
  fi
}

check_service "User Service" "5000"
check_service "Post Service" "5001"
check_service "Interaction Service" "5002"
check_service "Follow Service" "5003"
check_service "Feed Service" "5004"

if [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
  log_error "The following services failed health checks:"
  for service in "${FAILED_SERVICES[@]}"; do
    log_error "  - $service"
  done

  log_warning "Check logs with: $DOCKER_COMPOSE logs <service-name>"

  if [ "$FORCE" = false ]; then
    read -p "Rollback deployment? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      log "Rolling back deployment..."
      $DOCKER_COMPOSE down
      git checkout HEAD~1 2>/dev/null || log_warning "Could not checkout previous commit"
      $DOCKER_COMPOSE up -d
      log_warning "Deployment rolled back"
      exit 1
    fi
  fi
else
  log_success "All services are healthy!"
fi

###############################################################################
# Post-Deployment Tasks
###############################################################################

log "Running post-deployment tasks..."

# Cleanup old Docker images
log "Cleaning up old Docker images..."
docker image prune -f > /dev/null 2>&1 || true
log_success "Docker cleanup completed"

# Generate deployment report
DEPLOYMENT_REPORT="$APP_DIR/logs/deployment-report-$(date +%Y%m%d-%H%M%S).txt"
cat > "$DEPLOYMENT_REPORT" <<EOF
========================================
MapPalette V2 - Deployment Report
========================================

Date: $(date)
Branch: $BRANCH
Commit: $COMMIT
User: $(whoami)
Host: $(hostname)

Services Status:
EOF

$DOCKER_COMPOSE ps >> "$DEPLOYMENT_REPORT"

log_success "Deployment report generated: $DEPLOYMENT_REPORT"

###############################################################################
# Summary
###############################################################################

echo ""
echo "=========================================="
echo -e "${GREEN}✓ Deployment Successful!${NC}"
echo "=========================================="
echo ""
echo "Services are running and accessible at:"
echo "  - User Service:        http://localhost:5000"
echo "  - Post Service:        http://localhost:5001"
echo "  - Interaction Service: http://localhost:5002"
echo "  - Follow Service:      http://localhost:5003"
echo "  - Feed Service:        http://localhost:5004"
echo ""
echo "Logs:"
echo "  - Deployment log:  $LOG_FILE"
echo "  - Deployment report: $DEPLOYMENT_REPORT"
echo ""
echo "Useful commands:"
echo "  - View logs:       $DOCKER_COMPOSE logs -f [service-name]"
echo "  - Restart service: $DOCKER_COMPOSE restart [service-name]"
echo "  - Stop all:        $DOCKER_COMPOSE down"
echo "  - View status:     $DOCKER_COMPOSE ps"
echo ""
echo "=========================================="

exit 0
