# MapPaletteV2

**A professional, scalable social media platform for runners** built with modern web technologies and microservices architecture.

## Features

- 🏃 Create and share running routes with interactive map creation
- 🗺️ Google Maps integration with static map images
- 👥 Follow system and social feed
- ❤️ Like, comment, and share posts
- 🏆 Points-based leaderboard system
- 🔐 Secure authentication with Supabase Auth
- ⚡ Fast with Redis caching
- 📱 Responsive design

## Technology Stack

**Frontend:** Vue 3, Vite, Bootstrap 5
**Backend:** Node.js microservices, Express, Prisma ORM
**Database:** PostgreSQL 15 (Supabase)
**Cache:** Redis 7
**Infrastructure:** Docker, Supabase Platform
**Maps:** Google Maps API

## Quick Start

> 📖 **For detailed setup instructions and troubleshooting**, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

### Prerequisites

- Docker & Docker Compose (v2.0+)
- 10GB free disk space
- Node.js 18+ (optional, for local development)

### Setup (5 Minutes)

```bash
# Clone repository
cd MapPaletteV2

# Validate prerequisites (optional)
./scripts/validate-setup.sh

# Copy and configure environment file
cp .env.example .env
# Edit .env with your values (IMPORTANT: Change passwords and API keys!)

# Run automated setup
chmod +x setup.sh
./setup.sh
```

### Access Application

- **Frontend**: http://localhost:3000
- **Supabase Studio**: http://localhost:8000
- **API Gateway**: http://localhost:8080
- **Database**: localhost:5432
- **Redis**: localhost:6379

### First Steps

1. Open http://localhost:8000 (Supabase Studio)
2. Create a user account via Auth panel
3. Access frontend at http://localhost:3000
4. Start creating routes!

## Architecture Overview

### Microservices

**Atomic Services:**
- `user-service` - User management
- `post-service` - Route posts with map generation
- `interaction-service` - Likes, comments, shares
- `follow-service` - Follow/unfollow system

**Composite Services:**
- `feed-service` - Personalized feed aggregation
- `profile-service` - User profile with stats
- `social-interaction-service` - Social features orchestration
- `explore-routes-service` - Route discovery
- `leaderboard-service` - Rankings (Go)
- `user-discovery-service` - User recommendations (Java)

**Infrastructure:**
- PostgreSQL 15 via Supabase
- Redis 7 for caching
- Supabase Auth for authentication
- Kong API Gateway

## Development

See **[development.md](./development.md)** for comprehensive documentation including:

- Detailed architecture and tech stack
- API endpoints and schemas
- Reusable components
- Database schema
- Google Maps implementation
- External services reference
- Deployment guide
- Migration notes

## Security Features

- JWT authentication via Supabase
- Input validation with Zod schemas
- Multi-tier rate limiting
- CORS protection
- SQL injection prevention (Prisma ORM)
- XSS protection
- Ownership verification middleware

## Performance

- Feed load: <500ms (cached)
- API response: <100ms (p90)
- Database queries: <50ms (indexed)
- Cache hit rate: ~80%

## Deployment Cost

- **Development**: Free (local Docker)
- **Production**: ~$7/month (VPS + Google Maps API)

## What's New in V2

- Migrated from Firebase to Supabase PostgreSQL
- Added Redis caching (10x faster)
- Switched to Google Maps Static API
- Fixed critical security vulnerabilities
- Added cursor-based pagination
- Optimized database queries (eliminated N+1)
- Containerized all services
- Added comprehensive rate limiting

## Production Deployment

See [development.md#deployment](./development.md#deployment) for complete guide.

Quick deploy to VPS:

```bash
./deploy.sh
```

## Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f [service-name]

# Access database
docker compose exec supabase-db psql -U postgres postgres

# Run migrations
cd backend/shared && npx prisma migrate dev

# Generate Prisma client
cd backend/shared && npx prisma generate

# Backup database
docker compose exec supabase-db pg_dump -U postgres postgres > backup.sql

# Restore database
docker compose exec -T supabase-db psql -U postgres postgres < backup.sql
```

## Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup guide with troubleshooting
- **[DOCKER_SETUP.md](./DOCKER_SETUP.md)** - Docker-specific setup instructions
- **[.env.example](./.env.example)** - Environment configuration reference
- **[backend/shared/prisma/schema.prisma](./backend/shared/prisma/schema.prisma)** - Database schema

## License

MIT License

---

**For detailed development information**, see [development.md](./development.md)
