# MapPaletteV2 - Complete Setup Guide

This guide will help you set up the MapPaletteV2 development environment from scratch.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Docker** (v20.10+) and **Docker Compose** (v2.0+)
- **Git**
- At least **10GB** free disk space
- Ports available: 80, 443, 3000-3010, 5000, 5432, 6379, 8000, 8081, 8082

### Optional (for local development):
- **Node.js** 18+ (if you want to run services locally without Docker)
- **npm** or **yarn**

## 🚀 Quick Start (Recommended)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd MapPaletteV2
```

### 2. Run Setup Validation

```bash
./scripts/validate-setup.sh
```

This script will check:
- Docker and Docker Compose installation
- Available disk space
- Required ports
- System prerequisites

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

**IMPORTANT:** Edit `.env` and update these critical values:

```bash
# Database - Change from default!
POSTGRES_PASSWORD=your-secure-password-here

# JWT Secret - Generate with: openssl rand -base64 32
JWT_SECRET=<your-32+-character-secret>

# Internal Service Key - Generate with: openssl rand -hex 32
INTERNAL_SERVICE_KEY=<your-random-string>

# Google Maps API - Get from Google Cloud Console
GOOGLE_MAPS_API_KEY=<your-api-key>
VITE_GOOGLE_MAPS_MAP_ID=<your-map-id>
```

### 4. Run Setup

```bash
./setup.sh
```

This will:
1. Validate prerequisites
2. Build Docker images
3. Start all services
4. Run database migrations
5. Initialize Supabase

**OR** use the direct initialization script:

```bash
./scripts/init-docker.sh
```

### 5. Verify Installation

After setup completes, check that all services are running:

```bash
docker compose ps
```

All services should show as `healthy` or `running`.

## 🌐 Access Points

Once setup is complete, access the application at:

- **Frontend**: http://localhost:3000
- **Supabase Studio**: http://localhost:8081
- **Supabase API Gateway (Kong)**: http://localhost:8000
- **API (via Caddy)**: http://localhost (port 80)
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Service-Specific Ports

- **User Service**: http://localhost:3001
- **Post Service**: http://localhost:3002
- **Interaction Service**: http://localhost:3003
- **Feed Service**: http://localhost:3004
- **Social Interaction Service**: http://localhost:3005
- **Profile Service**: http://localhost:3006
- **Follow Service**: http://localhost:3007
- **Explore Routes Service**: http://localhost:3008
- **Leaderboard Service**: http://localhost:3009
- **User Discovery Service**: http://localhost:3010

## 📝 Detailed Setup Instructions

### Environment Variables Explained

#### Critical Variables (Must Change)
- `POSTGRES_PASSWORD`: Database password (default is insecure)
- `JWT_SECRET`: Secret for JWT tokens (must be 32+ characters)
- `INTERNAL_SERVICE_KEY`: Key for internal service authentication
- `GOOGLE_MAPS_API_KEY`: Your Google Maps API key

#### Supabase Variables
- `SUPABASE_ANON_KEY`: Anonymous key (can use default for development)
- `SUPABASE_SERVICE_KEY`: Service role key (can use default for development)
- `SUPABASE_PUBLIC_URL`: URL for Supabase services (default: http://localhost:8000)

#### Database Variables
- `DATABASE_URL`: Prisma connection string (update password to match POSTGRES_PASSWORD)
- `DIRECT_URL`: Direct database connection (update password to match POSTGRES_PASSWORD)

### Generating Secure Keys

```bash
# Generate JWT Secret (32+ characters)
openssl rand -base64 32

# Generate Internal Service Key
openssl rand -hex 32

# Generate PG Meta Crypto Key
openssl rand -base64 32
```

### Getting Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Maps JavaScript API"
4. Create credentials (API Key)
5. Create a Map ID in [Maps Platform Studio](https://console.cloud.google.com/google/maps-apis/studio/maps)
6. Copy both the API key and Map ID to your `.env` file

## 🔧 Manual Setup (Alternative)

If you prefer to set up services step by step:

### 1. Start Core Infrastructure

```bash
docker compose up -d supabase-db redis
```

### 2. Wait for Database Health

```bash
docker compose ps supabase-db
```

Wait until status shows `healthy`.

### 3. Start Supabase Services

```bash
docker compose up -d supabase-auth supabase-rest supabase-storage imgproxy supabase-kong supabase-studio supabase-meta
```

### 4. Run Prisma Initialization

```bash
docker compose up prisma-init
```

Wait for completion message: "Prisma initialization complete!"

### 5. Start Application Services

```bash
docker compose up -d
```

### 6. Verify Everything

```bash
docker compose logs -f
```

Press Ctrl+C to exit logs.

## 🐛 Troubleshooting

### Database Connection Issues

**Symptom:** Services can't connect to database

**Solution:**
```bash
# Restart database
docker compose restart supabase-db

# Check database logs
docker compose logs supabase-db

# Verify database is healthy
docker compose ps supabase-db
```

### Port Already in Use

**Symptom:** Error binding to port

**Solution:**
```bash
# Find process using the port (example: port 3000)
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change the port in .env
FRONTEND_PORT=3001
```

### Prisma Migration Errors

**Symptom:** Migration fails or schema issues

**Solution:**
```bash
# Reset database (WARNING: This will delete all data)
docker compose down -v
docker compose up -d supabase-db

# Run migrations again
docker compose up prisma-init
```

### Supabase Auth Not Working

**Symptom:** Can't sign up or login

**Solution:**
```bash
# Check auth service logs
docker compose logs supabase-auth

# Verify Kong is routing properly
docker compose logs supabase-kong

# Test auth endpoint
curl http://localhost:8000/auth/v1/health
```

### Frontend Build Errors

**Symptom:** Frontend container fails to start

**Solution:**
```bash
# Rebuild frontend
docker compose build frontend --no-cache

# Check frontend logs
docker compose logs frontend

# Verify environment variables are set
docker compose exec frontend env | grep VITE_
```

## 🔄 Common Operations

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f user-service

# Last 100 lines
docker compose logs --tail=100 user-service
```

### Restart Services

```bash
# Restart specific service
docker compose restart user-service

# Restart all services
docker compose restart
```

### Stop Services

```bash
# Stop all services (keeps data)
docker compose down

# Stop and remove all data
docker compose down -v
```

### Database Operations

```bash
# Connect to database
docker compose exec supabase-db psql -U postgres -d postgres

# Run SQL file
docker compose exec -T supabase-db psql -U postgres -d postgres < your-file.sql

# Backup database
docker compose exec supabase-db pg_dump -U postgres postgres > backup.sql

# Restore database
docker compose exec -T supabase-db psql -U postgres postgres < backup.sql
```

### Rebuild Specific Service

```bash
# Rebuild and restart
docker compose build user-service --no-cache
docker compose up -d user-service
```

## 🧪 Testing the Setup

### 1. Test Supabase Auth

```bash
curl -X POST http://localhost:8000/auth/v1/signup \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

### 2. Test Frontend

Open http://localhost:3000 in your browser. You should see the MapPalette homepage.

### 3. Test API

```bash
# Health check
curl http://localhost/health

# User service
curl http://localhost:3001/health
```

### 4. Test Supabase Studio

Open http://localhost:8081 and explore your database tables.

## 📚 Additional Resources

- [Main README](./README.md) - Project overview
- [Docker Setup Guide](./DOCKER_SETUP.md) - Detailed Docker configuration
- [Environment Variables](./.env.example) - All available environment variables
- [Prisma Schema](./backend/shared/prisma/schema.prisma) - Database schema

## 🆘 Getting Help

If you encounter issues not covered in this guide:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review logs: `docker compose logs -f`
3. Validate your setup: `./scripts/validate-setup.sh`
4. Open an issue on GitHub with:
   - Error messages
   - Relevant logs
   - Steps to reproduce

## 🔐 Security Notes

### Development vs Production

**This setup is configured for DEVELOPMENT. For PRODUCTION:**

1. **Change ALL default passwords and secrets**
2. **Configure SMTP for email verification**
3. **Update CORS settings** in `supabase/kong.yml` and `Caddyfile`
4. **Set up SSL/TLS certificates** (Caddy does this automatically with a domain)
5. **Configure environment-specific `.env` files**
6. **Enable proper authentication** (disable auto-confirm)
7. **Review and harden security settings**

### Never Commit

- `.env` files with real credentials
- `*.local` environment files
- API keys or secrets

## ✅ Post-Setup Checklist

- [ ] All services show as healthy in `docker compose ps`
- [ ] Frontend accessible at http://localhost:3000
- [ ] Supabase Studio accessible at http://localhost:8081
- [ ] Can create a test user via signup
- [ ] Database tables visible in Supabase Studio
- [ ] No errors in `docker compose logs`
- [ ] Environment variables properly configured
- [ ] Google Maps API key configured (if using maps)

---

**Last Updated:** 2025-11-30
**MapPaletteV2 Version:** 2.0.0
