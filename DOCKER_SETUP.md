# MapPaletteV2 Docker Setup Guide

This guide will help you set up and run the complete MapPaletteV2 stack using Docker Compose, including Supabase for authentication and storage.

## 📋 Prerequisites

- **Docker** (v20.10+) and **Docker Compose** (v2.0+)
- **Git**
- At least **4GB RAM** available for Docker
- **Ports available**: 3000-3010, 5000, 5432, 6379, 8000, 8080

## 🏗️ Architecture Overview

The stack consists of:

### Supabase Core Services
- **PostgreSQL** (supabase-db) - Main database with auth schema
- **GoTrue** (supabase-auth) - Authentication service
- **PostgREST** (supabase-rest) - REST API for database
- **Storage API** (supabase-storage) - File storage service
- **ImgProxy** (imgproxy) - Image transformation service
- **Kong Gateway** (supabase-kong) - API gateway/router

### Application Services
- **Redis** - Caching layer
- **User Service** - User management
- **Post Service** - Route posts
- **Interaction Service** - Likes, comments, shares
- **Follow Service** - Social following
- **Feed Service** - Personalized feed
- **Frontend** - React/Vite application

## 🚀 Quick Start

### 1. Clone and Navigate

```bash
git clone <your-repo-url>
cd MapPaletteV2
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file and update these CRITICAL values:
# - POSTGRES_PASSWORD (change from default!)
# - JWT_SECRET (generate with: openssl rand -base64 32)
# - GOOGLE_MAPS_API_KEY (get from Google Cloud Console)
```

### 3. Run Initialization Script

```bash
# Run the automated setup script
./scripts/init-docker.sh
```

This script will:
- Validate your configuration
- Start Supabase services
- Initialize the database with required roles and schemas
- Run migrations
- Start all application services

### 4. Access Your Application

- **Frontend**: http://localhost:3000
- **Supabase API Gateway**: http://localhost:8000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 📝 Manual Setup (Alternative)

If you prefer to set up manually:

### Step 1: Environment Configuration

```bash
cp .env.example .env
```

**Required Environment Variables:**

```bash
# Database
POSTGRES_PASSWORD=your-secure-password-here
POSTGRES_DB=postgres

# JWT Configuration (minimum 32 characters)
JWT_SECRET=$(openssl rand -base64 32)

# Supabase Keys (can use defaults for development)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Maps
GOOGLE_MAPS_API_KEY=your-api-key-here
```

### Step 2: Start Supabase Services

```bash
# Start core infrastructure
docker compose up -d supabase-db redis

# Wait for database to be healthy
docker compose ps supabase-db

# Start remaining Supabase services
docker compose up -d supabase-auth supabase-rest supabase-storage imgproxy supabase-kong
```

### Step 3: Initialize Database

The database will automatically run initialization scripts from `supabase/volumes/db/init/`:
- `00-roles.sql` - Creates database roles
- `01-jwt.sql` - Configures JWT authentication
- `02-storage.sql` - Sets up storage schema
- `03-realtime.sql` - Configures realtime functionality

Verify initialization:

```bash
docker compose exec supabase-db psql -U postgres -d postgres -c "\du"
```

You should see roles: `authenticator`, `anon`, `authenticated`, `service_role`, `supabase_auth_admin`, `supabase_storage_admin`

### Step 4: Run Application Migrations

```bash
# Run Prisma migrations (from your local machine or a service container)
cd backend/shared
npx prisma migrate deploy

# Run custom SQL migrations
docker compose exec -T supabase-db psql -U postgres -d postgres < backend/shared/migrations/supabase-auth-setup.sql
docker compose exec -T supabase-db psql -U postgres -d postgres < backend/shared/migrations/add-storage-buckets.sql
```

### Step 5: Start Application Services

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f
```

## 🔍 Troubleshooting

### Issue: Database roles don't exist

**Symptoms**: Auth or Storage services fail with "role does not exist" errors

**Solution**:
```bash
# Recreate the database volume to trigger init scripts
docker compose down -v
docker compose up -d supabase-db
# Wait for healthy status, then start other services
```

### Issue: Kong Gateway not routing requests

**Symptoms**: 404 errors when accessing http://localhost:8000/auth or /storage

**Solution**:
```bash
# Verify Kong configuration
docker compose exec supabase-kong kong config parse /usr/local/kong/kong.yml

# Restart Kong
docker compose restart supabase-kong
```

### Issue: Storage service can't connect to database

**Symptoms**: Storage service logs show connection errors

**Solution**:
```bash
# Verify storage admin role exists
docker compose exec supabase-db psql -U postgres -c "\du supabase_storage_admin"

# If missing, recreate database:
docker compose down -v supabase-db-data
docker compose up -d supabase-db
```

### Issue: Frontend can't connect to backend services

**Symptoms**: Network errors in browser console

**Solution**:
- Verify all services are running: `docker compose ps`
- Check service logs: `docker compose logs [service-name]`
- Ensure VITE_SUPABASE_URL in .env matches Kong port (8000)

## 🧪 Testing the Setup

### Test Supabase Auth

```bash
# Create a test user
curl -X POST http://localhost:8000/auth/v1/signup \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

### Test Storage

```bash
# Upload a test file
curl -X POST http://localhost:8000/storage/v1/object/profile-pictures/test.txt \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --data-binary "Hello World"
```

### Test Database Connection

```bash
# Connect to PostgreSQL
docker compose exec supabase-db psql -U postgres -d postgres

# List tables
\dt

# Check Supabase schemas
\dn
```

## 📊 Service Health Checks

```bash
# View all service statuses
docker compose ps

# Check specific service logs
docker compose logs -f supabase-auth
docker compose logs -f supabase-storage
docker compose logs -f user-service

# View database logs
docker compose logs -f supabase-db
```

## 🛑 Stopping Services

```bash
# Stop all services (keeps data)
docker compose down

# Stop and remove all data
docker compose down -v

# Stop specific service
docker compose stop supabase-auth
```

## 🔄 Updating Services

```bash
# Pull latest images
docker compose pull

# Restart with new images
docker compose up -d --force-recreate
```

## 📁 Important Files

- `docker-compose.yml` - Main orchestration file
- `.env` - Environment configuration
- `supabase/kong.yml` - API gateway routing
- `supabase/volumes/db/init/` - Database initialization scripts
- `backend/shared/migrations/` - Application migrations
- `scripts/init-docker.sh` - Automated setup script

## 🔐 Security Notes

### Development vs Production

**Development (current setup):**
- Uses default JWT keys
- Auto-confirms emails
- CORS allows all origins
- Simplified authentication

**For Production, you MUST:**
1. Generate strong secrets:
   ```bash
   # JWT Secret (32+ chars)
   openssl rand -base64 32

   # Internal Service Key
   openssl rand -hex 32
   ```

2. Configure SMTP for real email verification:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-specific-password
   ```

3. Update CORS settings in `supabase/kong.yml`

4. Use environment-specific `.env` files

5. Enable SSL/TLS certificates via Caddy

## 🆘 Getting Help

### View Comprehensive Logs

```bash
# All services
docker compose logs -f

# Specific service with timestamps
docker compose logs -f --timestamps supabase-auth

# Last 100 lines
docker compose logs --tail=100 supabase-db
```

### Debug Database Issues

```bash
# Enter database container
docker compose exec supabase-db bash

# Connect to PostgreSQL
psql -U postgres -d postgres

# Useful queries
SELECT * FROM auth.users;
SELECT * FROM storage.buckets;
\dt auth.*
\dt storage.*
```

### Clean Slate Reset

```bash
# Nuclear option - removes everything
docker compose down -v
docker volume prune -f
docker network prune -f

# Then restart from scratch
./scripts/init-docker.sh
```

## 📚 Additional Resources

- [Supabase Self-Hosting Docs](https://supabase.com/docs/guides/self-hosting/docker)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Kong Gateway Documentation](https://docs.konghq.com/)

---

**Last Updated**: 2025-11-27
**MapPaletteV2 Version**: 2.0.0
