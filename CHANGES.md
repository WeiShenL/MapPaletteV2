# Docker & Supabase Configuration Changes

## Summary

This document outlines all changes made to fix Docker and Supabase integration issues in MapPaletteV2.

## Issues Fixed

### 1. ❌ Missing Database Initialization Scripts
**Problem**: Supabase services couldn't connect because required database roles didn't exist.

**Solution**: Created initialization SQL scripts in `supabase/volumes/db/init/`:
- `00-roles.sql` - Creates all required database roles (authenticator, anon, authenticated, service_role, supabase_auth_admin, supabase_storage_admin)
- `01-jwt.sql` - Sets up JWT configuration and auth schema
- `02-storage.sql` - Initializes storage schema with buckets and objects tables
- `03-realtime.sql` - Sets up realtime publication schema

### 2. ❌ Missing ImgProxy Service
**Problem**: Storage service referenced imgproxy but it wasn't defined in docker-compose.yml.

**Solution**: Added imgproxy service to `docker-compose.yml`:
```yaml
imgproxy:
  image: darthsim/imgproxy:v3.8
  volumes:
    - supabase-storage-data:/var/lib/storage:ro
```

### 3. ❌ Incomplete Kong Gateway Configuration
**Problem**: `kong.yml` was missing critical routes for storage API.

**Solution**: Extended `supabase/kong.yml` with:
- Storage API routes (`/storage/v1/*`)
- Health check routes (`/health`)
- Complete CORS plugin configuration

### 4. ❌ Missing Environment Variables
**Problem**: `.env.example` was missing variables for new services.

**Solution**: Added to `.env.example`:
- `IMGPROXY_ENABLE_WEBP_DETECTION`

### 5. ❌ No Initialization Orchestration
**Problem**: No clear process for setting up the complete stack.

**Solution**: Created `scripts/init-docker.sh` that:
- Validates environment configuration
- Starts services in correct order
- Waits for health checks
- Runs migrations
- Verifies setup

### 6. ❌ Missing Documentation
**Problem**: No comprehensive guide for Docker setup.

**Solution**: Created `DOCKER_SETUP.md` with:
- Architecture overview
- Quick start guide
- Manual setup instructions
- Troubleshooting section
- Security notes

## Files Created

```
supabase/volumes/db/init/
├── 00-roles.sql          # Database roles initialization
├── 01-jwt.sql            # JWT and auth schema setup
├── 02-storage.sql        # Storage schema initialization
└── 03-realtime.sql       # Realtime schema setup

scripts/
└── init-docker.sh        # Automated initialization script

DOCKER_SETUP.md           # Comprehensive setup documentation
CHANGES.md                # This file
```

## Files Modified

```
docker-compose.yml        # Added volume mounts, imgproxy service
supabase/kong.yml         # Added storage routes, CORS config
.env.example              # Added imgproxy variables
```

## How Database Initialization Works

### Automatic Initialization (PostgreSQL Init Scripts)

When the `supabase-db` container starts **for the first time**, PostgreSQL automatically runs all `.sql` files in `/docker-entrypoint-initdb.d/` in alphabetical order:

1. **00-roles.sql** (runs first)
   - Creates all Supabase-required database roles
   - Sets passwords from environment variables
   - Grants appropriate permissions
   - Enables required extensions (uuid-ossp, pgcrypto, pgjwt)

2. **01-jwt.sql**
   - Creates `auth` schema
   - Sets up JWT helper functions (auth.uid(), auth.role(), auth.email())
   - Creates `auth.users` table structure
   - Configures permissions

3. **02-storage.sql**
   - Creates `storage` schema
   - Sets up buckets and objects tables
   - Configures Row Level Security (RLS) policies
   - Creates helper functions

4. **03-realtime.sql**
   - Creates `realtime` schema
   - Sets up publication for change data capture

**Important**: These scripts only run on **first initialization**. If you need to re-run them:
```bash
docker compose down -v  # Removes volumes
docker compose up -d    # Triggers re-initialization
```

### Application Migrations (Prisma & Custom SQL)

After the database is initialized with base schemas, application-specific migrations run:

1. **Prisma Migrations** (`backend/shared/prisma/migrations/`)
   - Creates application tables (users, posts, follows, etc.)
   - Run with: `npx prisma migrate deploy`

2. **Custom SQL Migrations** (`backend/shared/migrations/`)
   - `supabase-auth-setup.sql` - Creates triggers to sync auth.users with public.users
   - `add-storage-buckets.sql` - Creates storage buckets for profile pictures and route images
   - Run via: `docker compose exec -T supabase-db psql -U postgres -d postgres < file.sql`

## Service Dependencies

The startup order is critical:

```
supabase-db (healthy)
  ├── redis (healthy)
  │
  ├── supabase-auth (depends on db)
  ├── supabase-rest (depends on db)
  │
  ├── imgproxy (for image transformation)
  │   └── supabase-storage (depends on db, rest, imgproxy)
  │
  └── supabase-kong (routes all traffic)
      └── Application Services
          ├── user-service
          ├── post-service
          ├── interaction-service
          ├── follow-service
          └── feed-service (depends on other atomic services)
              └── frontend (depends on all backend services)
```

## Testing the Fix

### 1. Verify Database Roles

```bash
docker compose exec supabase-db psql -U postgres -d postgres -c "\du"
```

Expected output should show:
- `authenticator`
- `anon`
- `authenticated`
- `service_role`
- `supabase_auth_admin`
- `supabase_storage_admin`
- `dashboard_user`

### 2. Verify Schemas

```bash
docker compose exec supabase-db psql -U postgres -d postgres -c "\dn"
```

Expected schemas:
- `public`
- `auth`
- `storage`
- `realtime`

### 3. Test Storage

```bash
# List storage buckets
docker compose exec supabase-db psql -U postgres -d postgres -c "SELECT * FROM storage.buckets;"
```

Expected buckets:
- `profile-pictures`
- `route-images`
- `route-images-optimized`

### 4. Test Auth

```bash
# Sign up a test user
curl -X POST http://localhost:8000/auth/v1/signup \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 5. Verify All Services Running

```bash
docker compose ps
```

All services should show `Up` and `healthy` status.

## Comparison with Official Supabase Setup

| Component | Official Supabase | Our Implementation | Status |
|-----------|------------------|-------------------|---------|
| Database Roles | ✅ Via init scripts | ✅ Via `00-roles.sql` | ✅ Fixed |
| Auth Schema | ✅ Auto-created | ✅ Via `01-jwt.sql` | ✅ Fixed |
| Storage Schema | ✅ Auto-created | ✅ Via `02-storage.sql` | ✅ Fixed |
| Realtime | ✅ Full setup | ⚠️ Minimal (no server) | ⚠️ Partial |
| Kong Routes | ✅ Complete | ✅ Auth + Storage + REST | ✅ Fixed |
| Studio Dashboard | ✅ Included | ❌ Not included | ℹ️ Optional |
| Edge Functions | ✅ Included | ❌ Not included | ℹ️ Not needed |

## Migration Path from Previous Setup

If you have an existing deployment:

### Option 1: Fresh Start (Recommended for Development)

```bash
# Backup data if needed
docker compose exec supabase-db pg_dump -U postgres postgres > backup.sql

# Clean slate
docker compose down -v

# Pull latest code with fixes
git pull origin <branch-name>

# Initialize
./scripts/init-docker.sh

# Restore data if needed
docker compose exec -T supabase-db psql -U postgres -d postgres < backup.sql
```

### Option 2: In-Place Update (For Production)

```bash
# Pull latest changes
git pull origin <branch-name>

# Run only the new init scripts manually
docker compose exec -T supabase-db psql -U postgres -d postgres < supabase/volumes/db/init/00-roles.sql
docker compose exec -T supabase-db psql -U postgres -d postgres < supabase/volumes/db/init/01-jwt.sql
docker compose exec -T supabase-db psql -U postgres -d postgres < supabase/volumes/db/init/02-storage.sql

# Restart services to pick up new configuration
docker compose down
docker compose up -d
```

## Common Issues and Solutions

### Issue: "role authenticator does not exist"

**Cause**: Database was created before init scripts were added.

**Solution**:
```bash
docker compose down -v
docker compose up -d
```

### Issue: Storage API fails to start

**Cause**: `supabase_storage_admin` role doesn't exist or imgproxy is missing.

**Solution**: Verify imgproxy is running and role exists:
```bash
docker compose ps imgproxy
docker compose exec supabase-db psql -U postgres -c "\du supabase_storage_admin"
```

### Issue: Kong returns 404 for /storage routes

**Cause**: Old `kong.yml` doesn't have storage routes.

**Solution**: Verify kong.yml has storage-v1 service:
```bash
docker compose exec supabase-kong kong config parse /usr/local/kong/kong.yml
docker compose restart supabase-kong
```

## Future Improvements

1. **Add Supabase Studio** - Web dashboard for database management
2. **Add Realtime Server** - Full realtime subscriptions support
3. **Add Edge Functions** - Serverless function support
4. **Connection Pooling** - Add PgBouncer or Supavisor for better connection management
5. **Monitoring** - Add Prometheus/Grafana for metrics
6. **Backup Automation** - Scheduled database backups

## References

- [Supabase Self-Hosting Documentation](https://supabase.com/docs/guides/self-hosting/docker)
- [Official Supabase Docker Repository](https://github.com/supabase/supabase/tree/master/docker)
- [PostgreSQL Init Scripts](https://hub.docker.com/_/postgres) - See "Initialization scripts" section
- [Kong Gateway Configuration](https://docs.konghq.com/gateway/latest/)

---

**Date**: 2025-11-27
**Author**: Claude Code
**Branch**: `claude/frontend-migration-01Jz7Jm58zs7gEbfbciYZCyi`
