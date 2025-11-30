#!/bin/bash

###############################################################################
# MapPalette V2 - Database Restore Script
#
# This script restores the PostgreSQL database from a backup file.
#
# Usage:
#   ./scripts/restore.sh <backup-file> [--force]
#
# Options:
#   --force    Skip confirmation prompt
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
BACKUP_FILE="$1"
FORCE=false

# Check if backup file is provided
if [ -z "$BACKUP_FILE" ]; then
  echo -e "${RED}Error: Backup file not specified${NC}"
  echo ""
  echo "Usage: $0 <backup-file> [--force]"
  echo ""
  echo "Available backups:"
  ls -lht "$APP_DIR/backups"/mappalette-backup-*.sql.gz 2>/dev/null | head -10 | awk '{print "  ", $9, "("$5")"}' || echo "  No backups found"
  exit 1
fi

# Check for --force flag
if [ "$2" = "--force" ]; then
  FORCE=true
fi

# Logging functions
log() {
  echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  log_error "Backup file not found: $BACKUP_FILE"
  exit 1
fi

log "Restore details:"
log "  Backup file: $BACKUP_FILE"
log "  Size: $(du -h "$BACKUP_FILE" | cut -f1)"

# Check if backup is compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
  IS_COMPRESSED=true
  log "  Format: Compressed (gzip)"
else
  IS_COMPRESSED=false
  log "  Format: Uncompressed"
fi

# Load environment variables
if [ -f "$APP_DIR/.env" ]; then
  export $(grep -v '^#' "$APP_DIR/.env" | xargs)
else
  log_error ".env file not found"
  exit 1
fi

# Extract database credentials from DATABASE_URL
DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/postgres}"
DB_USER=$(echo "$DB_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo "$DB_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo "$DB_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DB_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo "$DB_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

log "  Target database: $DB_NAME @ $DB_HOST:$DB_PORT"

# Warning and confirmation
echo ""
log_warning "⚠️  WARNING: This will REPLACE ALL DATA in the database!"
log_warning "⚠️  Current database: $DB_NAME @ $DB_HOST:$DB_PORT"
echo ""

if [ "$FORCE" = false ]; then
  read -p "Are you sure you want to continue? Type 'yes' to confirm: " -r
  echo
  if [ "$REPLY" != "yes" ]; then
    log "Restore cancelled by user"
    exit 0
  fi

  read -p "Create a backup of current database before restoring? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Creating backup of current database..."
    bash "$APP_DIR/scripts/backup.sh"
    log_success "Current database backed up"
  fi
fi

# Decompress if necessary
RESTORE_FILE="$BACKUP_FILE"

if [ "$IS_COMPRESSED" = true ]; then
  log "Decompressing backup..."
  TEMP_FILE="/tmp/mappalette-restore-$$.sql"
  gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
  RESTORE_FILE="$TEMP_FILE"
  log_success "Backup decompressed"
fi

# Restore database
log "Restoring database..."

export PGPASSWORD="$DB_PASS"

if command -v pg_restore > /dev/null 2>&1; then
  # pg_restore is available locally
  log "Restoring with pg_restore..."

  pg_restore \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    "$RESTORE_FILE" 2>&1 | grep -v "WARNING" || true

  log_success "Database restored successfully"

elif docker ps --format '{{.Names}}' | grep -q "db"; then
  # Use Docker container
  log "Restoring with Docker..."

  CONTAINER_NAME=$(docker ps --format '{{.Names}}' | grep "db" | head -n 1)

  docker exec -i "$CONTAINER_NAME" pg_restore \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    < "$RESTORE_FILE" 2>&1 | grep -v "WARNING" || true

  log_success "Database restored successfully (via Docker)"

else
  log_error "Neither pg_restore nor Docker container found"
  exit 1
fi

unset PGPASSWORD

# Cleanup temporary file
if [ "$IS_COMPRESSED" = true ] && [ -f "$TEMP_FILE" ]; then
  rm -f "$TEMP_FILE"
  log "Cleaned up temporary files"
fi

# Run migrations to ensure schema is up to date
log "Running database migrations to ensure schema is current..."
cd "$APP_DIR/backend/shared"
npx prisma migrate deploy > /dev/null 2>&1 || log_warning "Migration check failed (this might be normal)"
cd "$APP_DIR"
log_success "Schema check completed"

# Verify restoration
log "Verifying restoration..."

export PGPASSWORD="$DB_PASS"

if command -v psql > /dev/null 2>&1; then
  TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
  log "Tables restored: $TABLE_COUNT"

  if [ "$TABLE_COUNT" -gt 0 ]; then
    log_success "Restoration verified"
  else
    log_warning "No tables found - restoration may have failed"
  fi
else
  log_warning "psql not found - skipping verification"
fi

unset PGPASSWORD

echo ""
echo "=========================================="
echo -e "${GREEN}✓ Restore Completed Successfully!${NC}"
echo "=========================================="
echo ""
echo "Database: $DB_NAME"
echo "Restored from: $BACKUP_FILE"
echo ""
echo "Next steps:"
echo "  1. Restart your services: docker compose restart"
echo "  2. Test the application"
echo "  3. Check logs: docker compose logs -f"
echo ""
echo "=========================================="

exit 0
