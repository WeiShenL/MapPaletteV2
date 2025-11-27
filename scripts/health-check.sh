#!/bin/bash

###############################################################################
# MapPalette V2 - Health Check Script
#
# This script checks the health of all services and reports their status.
#
# Usage:
#   ./scripts/health-check.sh [--detailed] [--alert]
#
# Options:
#   --detailed    Show detailed information for each service
#   --alert       Send alerts if services are down (requires configuration)
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DETAILED=false
ALERT=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --detailed)
      DETAILED=true
      shift
      ;;
    --alert)
      ALERT=true
      shift
      ;;
    *)
      ;;
  esac
done

# Service definitions
declare -A SERVICES=(
  ["User Service"]="5000"
  ["Post Service"]="5001"
  ["Interaction Service"]="5002"
  ["Follow Service"]="5003"
  ["Feed Service"]="5004"
  ["PostgreSQL"]="5432"
  ["Redis"]="6379"
)

# Health check function
check_service_health() {
  SERVICE_NAME=$1
  SERVICE_PORT=$2

  # Check if port is listening
  if ! nc -z localhost "$SERVICE_PORT" 2>/dev/null; then
    echo -e "${RED}✗${NC} $SERVICE_NAME (port $SERVICE_PORT) - ${RED}NOT RUNNING${NC}"
    return 1
  fi

  # Try HTTP health endpoint for API services
  if [ "$SERVICE_PORT" -lt 6000 ]; then
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$SERVICE_PORT/health" 2>/dev/null || echo "000")

    if [ "$RESPONSE" = "200" ]; then
      echo -e "${GREEN}✓${NC} $SERVICE_NAME (port $SERVICE_PORT) - ${GREEN}HEALTHY${NC}"

      if [ "$DETAILED" = true ]; then
        HEALTH_DATA=$(curl -s "http://localhost:$SERVICE_PORT/health" 2>/dev/null || echo "{}")
        echo "   Response: $HEALTH_DATA"
      fi

      return 0
    else
      echo -e "${YELLOW}⚠${NC} $SERVICE_NAME (port $SERVICE_PORT) - ${YELLOW}UNHEALTHY${NC} (HTTP $RESPONSE)"
      return 1
    fi
  else
    # Database/cache services
    echo -e "${GREEN}✓${NC} $SERVICE_NAME (port $SERVICE_PORT) - ${GREEN}RUNNING${NC}"
    return 0
  fi
}

# Check Docker status
check_docker_status() {
  echo "Docker Containers:"
  echo "=================="

  if command -v docker > /dev/null 2>&1; then
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "mappalette|NAME"
    echo ""
  else
    echo -e "${RED}Docker not found${NC}"
    return 1
  fi
}

# Check system resources
check_system_resources() {
  echo "System Resources:"
  echo "================="

  # CPU usage
  if command -v top > /dev/null 2>&1; then
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    echo -e "CPU Usage: ${CPU_USAGE}%"
  fi

  # Memory usage
  if command -v free > /dev/null 2>&1; then
    MEM_USAGE=$(free | grep Mem | awk '{printf("%.1f%%", $3/$2 * 100.0)}')
    echo -e "Memory Usage: $MEM_USAGE"
  fi

  # Disk usage
  if command -v df > /dev/null 2>&1; then
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}')
    echo -e "Disk Usage: $DISK_USAGE"
  fi

  echo ""
}

# Main health check
echo "=========================================="
echo "MapPalette V2 - Health Check"
echo "=========================================="
echo "Time: $(date)"
echo ""

FAILED_SERVICES=()
HEALTHY_COUNT=0
TOTAL_COUNT=${#SERVICES[@]}

# Check each service
echo "Service Status:"
echo "==============="

for SERVICE_NAME in "${!SERVICES[@]}"; do
  SERVICE_PORT=${SERVICES[$SERVICE_NAME]}

  if check_service_health "$SERVICE_NAME" "$SERVICE_PORT"; then
    HEALTHY_COUNT=$((HEALTHY_COUNT + 1))
  else
    FAILED_SERVICES+=("$SERVICE_NAME")
  fi
done

echo ""

# Show Docker status if detailed
if [ "$DETAILED" = true ]; then
  check_docker_status
  check_system_resources
fi

# Summary
echo "=========================================="
echo "Summary: $HEALTHY_COUNT/$TOTAL_COUNT services healthy"
echo "=========================================="

if [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
  echo ""
  echo -e "${RED}Failed Services:${NC}"
  for service in "${FAILED_SERVICES[@]}"; do
    echo "  - $service"
  done
  echo ""
  echo "Troubleshooting:"
  echo "  1. Check logs: docker compose logs -f <service-name>"
  echo "  2. Restart service: docker compose restart <service-name>"
  echo "  3. Rebuild service: docker compose up -d --build <service-name>"
  echo ""

  # Send alert if configured
  if [ "$ALERT" = true ]; then
    # Add your alerting logic here (email, Slack, etc.)
    echo "⚠️  Alerts would be sent here (configure ALERT_WEBHOOK or ALERT_EMAIL)"
  fi

  exit 1
else
  echo -e "${GREEN}✓ All services are healthy!${NC}"
  exit 0
fi
