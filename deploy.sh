#!/bin/bash

# MapPaletteV2 - Deployment Script for Production VPS
# Run this on your Hetzner/Contabo server

set -e

echo "🚀 MapPaletteV2 Production Deployment"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Please run as root or with sudo${NC}"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt-get update && apt-get upgrade -y
echo -e "${GREEN}✅ System updated${NC}"

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo -e "${GREEN}✅ Docker installed${NC}"
else
    echo -e "${GREEN}✅ Docker already installed${NC}"
fi

# Install Docker Compose if not installed
if ! command -v docker compose &> /dev/null; then
    echo "🐳 Installing Docker Compose..."
    apt-get install -y docker-compose-plugin
    echo -e "${GREEN}✅ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✅ Docker Compose already installed${NC}"
fi

# Setup firewall
echo "🔥 Configuring firewall..."
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw reload
echo -e "${GREEN}✅ Firewall configured${NC}"

# Create app directory
APP_DIR="/opt/mappalette"
echo "📁 Creating application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found in $APP_DIR${NC}"
    echo -e "${YELLOW}Please create .env file with production values${NC}"
    exit 1
fi

# Pull latest code (assuming git repo)
if [ -d ".git" ]; then
    echo "📥 Pulling latest code..."
    git pull origin main
else
    echo -e "${YELLOW}⚠️  Not a git repository. Please ensure code is uploaded${NC}"
fi

# Setup shared dependencies
echo "📦 Setting up shared dependencies..."
cd backend/shared
npm install --production
npx prisma generate
cd ../..

# Build and start services
echo "🐳 Building and starting services..."
docker compose down
docker compose build
docker compose up -d

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 15

# Run database migrations
echo "🗄️  Running database migrations..."
docker compose exec -T user-service sh -c "cd /app/shared && npx prisma migrate deploy"

# Setup backup cron job
echo "💾 Setting up daily backups..."
cat > /etc/cron.daily/mappalette-backup << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/mappalette/backups"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
docker compose exec -T supabase-db pg_dump -U postgres postgres | gzip > $BACKUP_DIR/backup_$DATE.sql.gz
# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
EOF
chmod +x /etc/cron.daily/mappalette-backup
echo -e "${GREEN}✅ Backup cron job created${NC}"

# Setup log rotation
echo "📝 Setting up log rotation..."
cat > /etc/logrotate.d/mappalette << 'EOF'
/var/log/caddy/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
}
EOF
echo -e "${GREEN}✅ Log rotation configured${NC}"

# Display status
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "📍 Your application should now be running"
echo ""
echo "🔍 Check status:"
echo "   docker compose ps"
echo ""
echo "📊 View logs:"
echo "   docker compose logs -f"
echo ""
echo "🔄 Restart services:"
echo "   docker compose restart"
echo ""
echo -e "${YELLOW}⚠️  Next steps:${NC}"
echo "   1. Point your domain DNS to this server's IP"
echo "   2. Update DOMAIN variable in .env"
echo "   3. Restart Caddy: docker compose restart caddy"
echo "   4. SSL will be automatically configured by Caddy"
echo ""
