#!/bin/bash

###############################################################################
# MapPalette V2 - Database Backup Script
#
# This script creates backups of the PostgreSQL database.
#
# Usage:
#   ./scripts/backup.sh [--retention-days 7]
#
# Options:
#   --retention-days N    Delete backups older than N days (default: 7)
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
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/mappalette-backup-$TIMESTAMP.sql"
RETENTION_DAYS=7

# Parse arguments
for arg in "$@"; do
  case $arg in
    --retention-days)
      RETENTION_DAYS="$2"
      shift 2
      ;;
    *)
      ;;
  esac
done

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

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

log "Starting database backup..."

# Load environment variables
if [ -f "$APP_DIR/.env" ]; then
  export $(grep -v '^#' "$APP_DIR/.env" | xargs)
else
  log_error ".env file not found"
  exit 1
fi

# Extract database credentials from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/postgres}"

# Parse DATABASE_URL
DB_USER=$(echo "$DB_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo "$DB_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo "$DB_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DB_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo "$DB_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

log "Database: $DB_NAME @ $DB_HOST:$DB_PORT"
log "Backup file: $BACKUP_FILE"

# Create backup using pg_dump
export PGPASSWORD="$DB_PASS"

if command -v pg_dump > /dev/null 2>&1; then
  # pg_dump is available locally
  log "Creating backup with pg_dump..."

  pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    -F c \
    -f "$BACKUP_FILE"

  log_success "Backup created successfully"

elif docker ps --format '{{.Names}}' | grep -q "db"; then
  # Use Docker container
  log "Creating backup with Docker..."

  CONTAINER_NAME=$(docker ps --format '{{.Names}}' | grep "db" | head -n 1)

  docker exec "$CONTAINER_NAME" pg_dump \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    -F c \
    > "$BACKUP_FILE"

  log_success "Backup created successfully (via Docker)"

else
  log_error "Neither pg_dump nor Docker container found"
  exit 1
fi

unset PGPASSWORD

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "Backup size: $BACKUP_SIZE"

# Compress backup
log "Compressing backup..."
gzip -f "$BACKUP_FILE"
COMPRESSED_FILE="${BACKUP_FILE}.gz"
COMPRESSED_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
log_success "Compressed size: $COMPRESSED_SIZE"

# Cleanup old backups
log "Cleaning up old backups (retention: $RETENTION_DAYS days)..."
DELETED_COUNT=0

find "$BACKUP_DIR" -name "mappalette-backup-*.sql.gz" -type f -mtime +$RETENTION_DAYS | while read -r old_backup; do
  rm -f "$old_backup"
  DELETED_COUNT=$((DELETED_COUNT + 1))
  log "Deleted: $(basename "$old_backup")"
done

if [ $DELETED_COUNT -gt 0 ]; then
  log_success "Deleted $DELETED_COUNT old backup(s)"
else
  log "No old backups to delete"
fi

# List recent backups
log "Recent backups:"
ls -lht "$BACKUP_DIR"/mappalette-backup-*.sql.gz | head -5 | awk '{print "  ", $9, "("$5")"}'

# Create backup metadata
METADATA_FILE="${COMPRESSED_FILE}.meta"
cat > "$METADATA_FILE" <<EOF
Backup Metadata
===============
Date: $(date)
Database: $DB_NAME
Host: $DB_HOST:$DB_PORT
User: $DB_USER
Original Size: $BACKUP_SIZE
Compressed Size: $COMPRESSED_SIZE
Timestamp: $TIMESTAMP
EOF

log_success "Backup metadata saved: $METADATA_FILE"

echo ""
echo "=========================================="
echo -e "${GREEN}✓ Backup Completed Successfully!${NC}"
echo "=========================================="
echo ""
echo "Backup file: $COMPRESSED_FILE"
echo "Compressed size: $COMPRESSED_SIZE"
echo ""
echo "To restore this backup:"
echo "  ./scripts/restore.sh $COMPRESSED_FILE"
echo ""
echo "=========================================="

exit 0
