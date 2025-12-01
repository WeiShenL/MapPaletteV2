# MapPaletteV2 - Developer Guide

**Complete technical documentation for developers**

Last Updated: November 2025

---

## Table of Contents

1. [Architecture](#architecture)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Setup & Development](#setup--development)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Authentication](#authentication)
8. [Google Maps Integration](#google-maps-integration)
9. [Caching Strategy](#caching-strategy)
10. [Rate Limiting](#rate-limiting)
11. [External Services](#external-services)
12. [Reusable Components](#reusable-components)
13. [Deployment](#deployment)
14. [Migration Notes](#migration-notes)

---

## Architecture

### System Overview

MapPaletteV2 follows a **microservices architecture** with clear separation of concerns:

```
┌─────────────┐
│   Frontend  │ (Vue 3)
│  Port 3000  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Kong Gateway│ (API Gateway)
│  Port 8080  │
└──────┬──────┘
       │
       ├───────────────┬──────────────┬────────────────┐
       │               │              │                │
       ▼               ▼              ▼                ▼
┌──────────┐   ┌─────────────┐  ┌────────────┐  ┌──────────┐
│  Atomic  │   │  Composite  │  │   Redis    │  │ Supabase │
│ Services │   │  Services   │  │   Cache    │  │ Platform │
└──────────┘   └─────────────┘  └────────────┘  └──────────┘
```

### Atomic Services

Atomic services handle single entities and their CRUD operations:

- **user-service** (Port 3001) - User management
  - Create/update/delete users
  - User search and batch retrieval
  - Profile picture uploads

- **post-service** (Port 3002) - Route posts with map generation
  - Create posts with waypoints
  - Generate map images via Google Maps API
  - Upload to Supabase Storage
  - CRUD operations with caching

- **interaction-service** (Port 3003) - Social interactions
  - Likes (create, remove, check status)
  - Comments (create, get, delete)
  - Shares
  - Batch interaction queries

- **follow-service** (Port 3007) - Follow system
  - Follow/unfollow users
  - Get followers/following lists
  - Check follow status

### Composite Services

Composite services orchestrate multiple atomic services:

- **feed-service** (Port 3004) - Personalized feed
  - Aggregates posts from followed users
  - Enriches with user data and interaction counts
  - Heavy caching with Redis

- **profile-service** (Port 3006) - User profiles
  - Aggregates user data, posts, stats
  - Combines data from multiple services

- **social-interaction-service** (Port 3005) - Social features
  - Orchestrates likes, comments, shares across services

- **explore-routes-service** (Port 3008) - Route discovery
  - Discover trending routes
  - Filter and search capabilities

- **leaderboard-service** (Port 8080) - Rankings (Go)
  - User rankings by points
  - Top users leaderboard

- **user-discovery-service** (Port 3010) - User recommendations (Java/Spring Boot)
  - User discovery and recommendations
  - Follow suggestions

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Vue.js | 3.x | Progressive framework |
| Vite | Latest | Build tool & dev server |
| Bootstrap | 5.x | UI framework |
| Google Maps JS API | Latest | Interactive map creation |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime for most services |
| Express | 4.x | Web framework |
| Prisma | 5.22.0 | ORM for PostgreSQL |
| @supabase/supabase-js | 2.82.0 | Supabase client |
| ioredis | 5.3.2 | Redis client |
| Bull | 4.16.5 | Job queue system |
| Zod | 3.25.76 | Schema validation |
| Winston | 3.18.3 | Logging |
| express-rate-limit | 7.5.1 | Rate limiting |

### Database & Infrastructure

| Service | Version | Purpose |
|---------|---------|---------|
| PostgreSQL | 15.8 | Primary database |
| Redis | 7.x | Caching & rate limiting |
| Supabase | Latest | Auth, Storage, PostgREST |
| Kong | 2.8.1 | API Gateway |
| Docker | Latest | Containerization |

### Alternative Runtimes

- **Go** - leaderboard-service (Gin framework)
- **Java** - user-discovery-service (Spring Boot)

---

## Project Structure

```
MapPaletteV2/
├── backend/
│   ├── services/
│   │   ├── atomic/
│   │   │   ├── user-service/
│   │   │   ├── post-service/
│   │   │   ├── interaction-service/
│   │   │   └── follow-service/
│   │   └── composite/
│   │       ├── feed-service/
│   │       ├── profile-service/
│   │       ├── social-interaction-service/
│   │       ├── explore-routes-service/
│   │       ├── leaderboard-service/ (Go)
│   │       └── user-discovery-service/ (Java)
│   ├── shared/
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── rateLimiter.js
│   │   │   ├── mapRateLimiter.js
│   │   │   ├── validator.js
│   │   │   └── errorHandler.js
│   │   └── utils/
│   │       ├── db.js
│   │       ├── redis.js
│   │       ├── logger.js
│   │       ├── googleMapsRenderer.js
│   │       ├── storageService.js
│   │       └── queue.js
│   ├── scripts/
│   │   └── migrate/ (Firebase migration scripts)
│   ├── docker-compose.yml
│   └── .env.example
├── frontend/ (Vue 3 application)
├── README.md
└── development.md (this file)
```

---

## Setup & Development

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Git
- 10GB free disk space

### Initial Setup

```bash
# Clone repository
git clone <repo-url>
cd MapPaletteV2

# Copy environment file
cp .env.example .env

# Edit environment variables (optional for local dev)
nano .env

# Run automated setup
chmod +x setup.sh
./setup.sh
```

The setup script will:
1. Install backend dependencies
2. Generate Prisma client
3. Build Docker images
4. Start all services
5. Run database migrations

### Development Workflow

```bash
# Start all services
docker compose up -d

# View logs (all services)
docker compose logs -f

# View logs (specific service)
docker compose logs -f user-service

# Restart a service
docker compose restart post-service

# Stop all services
docker compose down

# Stop and remove volumes (fresh start)
docker compose down -v
```

### Working with Database

```bash
# Access database CLI
docker compose exec supabase-db psql -U postgres postgres

# Run migrations
cd backend/shared
npx prisma migrate dev --name <migration_name>

# Generate Prisma client (after schema changes)
npx prisma generate

# View database in Prisma Studio
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Working with Redis

```bash
# Access Redis CLI
docker compose exec redis redis-cli

# Common Redis commands
KEYS *              # List all keys
GET key             # Get value
DEL key             # Delete key
FLUSHALL            # Clear all data (use with caution)
```

### Environment Variables

See `.env.example` for complete configuration. Key variables:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@supabase-db:5432/postgres

# Supabase
SUPABASE_PUBLIC_URL=http://supabase-kong:8000
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_KEY=<your-service-key>

# Redis
REDIS_URL=redis://redis:6379

# Google Maps
GOOGLE_MAPS_API_KEY=<your-api-key>

# Service Keys (for inter-service auth)
INTERNAL_SERVICE_KEY=<random-secret>
```

---

## Database Schema

### Core Models

See `backend/shared/prisma/schema.prisma` for complete schema.

**User**
```prisma
model User {
  id              String    @id @default(uuid())
  username        String    @unique
  email           String    @unique
  profilePicture  String?
  bio             String?
  points          Int       @default(0)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  posts           Post[]
  likes           Like[]
  comments        Comment[]
  shares          Share[]
  followers       Follow[]  @relation("UserFollowers")
  following       Follow[]  @relation("UserFollowing")
}
```

**Post**
```prisma
model Post {
  id            String   @id @default(uuid())
  userId        String
  title         String
  description   String?
  waypoints     String   // JSON array of {lat, lng}
  color         String   @default("#FF0000")
  region        String
  distance      Float
  imageUrl      String?
  likeCount     Int      @default(0)
  commentCount  Int      @default(0)
  shareCount    Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  likes         Like[]
  comments      Comment[]
  shares        Share[]
}
```

**Interactions (Like, Comment, Share, Follow)**
- All have composite unique constraints
- Cascade delete on user/post deletion
- Indexed for query performance

---

## API Endpoints

### User Service (Port 3001)

```
GET    /api/users              - Get all users (paginated)
GET    /api/users/:id          - Get user by ID
GET    /api/users/search       - Search users by username
POST   /api/users              - Create user
PUT    /api/users/:id          - Update user
DELETE /api/users/:id          - Delete user
POST   /api/users/batch        - Get multiple users (batch)
POST   /api/users/:id/picture  - Upload profile picture
```

### Post Service (Port 3002)

```
GET    /api/allposts                - Get all posts (cursor pagination)
GET    /api/posts?id=<postId>       - Get single post
GET    /api/users/:userID/posts     - Get user's posts
POST   /api/create/:userID          - Create post (with map generation)
PUT    /api/posts?id=<postId>       - Update post
DELETE /api/posts?id=<postId>       - Delete post
```

**Create Post Example:**
```json
POST /api/create/user123
{
  "title": "Morning Run",
  "description": "Beautiful sunrise route",
  "waypoints": "[{\"lat\":1.3521,\"lng\":103.8198},{\"lat\":1.3531,\"lng\":103.8208}]",
  "color": "#FF5733",
  "region": "Singapore",
  "distance": 5.2
}
```

Response includes post with generated `imageUrl` from Google Maps.

### Interaction Service (Port 3003)

```
POST   /api/like/:entityType/:entityId        - Like entity
DELETE /api/like/:entityType/:entityId        - Unlike entity
GET    /api/like/:entityId/status             - Check if liked
POST   /api/share/:entityType/:entityId       - Share entity
POST   /api/comment/:entityType/:entityId     - Create comment
GET    /api/comments/:entityType/:entityId    - Get comments (paginated)
DELETE /api/comment/:commentId                - Delete comment
POST   /api/interactions/batch                - Get interactions for multiple posts
```

### Follow Service (Port 3007)

```
POST   /api/follow/:userId          - Follow user
DELETE /api/follow/:userId          - Unfollow user
GET    /api/follow/:userId/status   - Check follow status
GET    /api/followers/:userId       - Get followers
GET    /api/following/:userId       - Get following
```

### Feed Service (Port 3004)

```
GET    /api/feed/:userId              - Get personalized feed
GET    /api/feed/:userId/following    - Get feed from followed users only
GET    /api/feed/:userId/explore      - Get explore feed (all posts)
```

**Feed Response:**
```json
{
  "posts": [
    {
      "id": "post-uuid",
      "title": "Morning Run",
      "user": {
        "id": "user-uuid",
        "username": "runner123",
        "profilePicture": "https://..."
      },
      "imageUrl": "https://...",
      "likeCount": 42,
      "commentCount": 5,
      "shareCount": 3,
      "liked": true,
      "createdAt": "2025-11-18T10:00:00Z"
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "post-uuid"
  }
}
```

---

## Authentication

### Supabase Auth Integration

All protected routes use Supabase JWT authentication.

**Middleware:** `backend/shared/middleware/auth.js`

```javascript
const { verifyAuth, verifyOwnership, optionalAuth } = require('/app/shared/middleware/auth');

// Require authentication
router.post('/create', verifyAuth, createPost);

// Require authentication + ownership
router.put('/posts/:id', verifyAuth, verifyOwnership('id'), updatePost);

// Optional authentication (for public + personalized content)
router.get('/feed', optionalAuth, getFeed);
```

**Authentication Flow:**

1. Frontend authenticates with Supabase Auth
2. Receives JWT token
3. Includes token in requests: `Authorization: Bearer <token>`
4. Middleware verifies token with Supabase
5. Attaches user info to `req.user`

**User Object:**
```javascript
req.user = {
  id: "user-uuid",
  email: "user@example.com",
  ...user.user_metadata
}
```

### Creating Users

Users are created via Supabase Auth (not directly in database). After signup:

1. User authenticates with Supabase
2. Call `POST /api/users` to create profile in PostgreSQL
3. Link via user ID from JWT token

---

## Google Maps Integration

### Static Maps API

**File:** `backend/shared/utils/googleMapsRenderer.js`

MapPaletteV2 uses Google Maps Static API to generate route images. When a user creates a post with waypoints, the system:

1. Encodes waypoints into Google polyline format
2. Generates Static Map URLs for 3 sizes (thumbnail, medium, large)
3. Fetches images from Google Maps API
4. Uploads to Supabase Storage
5. Caches the URL by waypoints hash (30 days)

**Image Sizes:**
- **Thumbnail:** 300x200 (for feed/list views)
- **Medium:** 600x400 (for modal/detail views)
- **Large:** 1200x800 (for full-screen views)

**Cost Optimization:**

1. **Caching by waypoints hash** - Same route = same image
   ```javascript
   const hash = md5(JSON.stringify(waypoints) + color);
   const cacheKey = `map:${hash}`;
   ```

2. **3-tier rate limiting** (see Rate Limiting section)

3. **Expected cache hit rate:** 30-50%

**Estimated Costs:**
- 1000 unique routes/month × $0.002 = $2/month
- With caching: ~$1/month

**Map Generation Flow:**

```
1. User creates post with waypoints
2. Check Redis cache for waypoints hash
3. If cached → use cached URL
4. If not cached:
   a. Encode waypoints to polyline
   b. Generate Static Map URLs (3 sizes)
   c. Fetch images via axios
   d. Upload to Supabase Storage
   e. Cache URL for 30 days
   f. Return URL to client
```

**Usage Example:**

```javascript
const { renderMapFromPost } = require('/app/shared/utils/googleMapsRenderer');

// In post controller
const mapImages = await renderMapFromPost({
  waypoints: parsedWaypoints,
  color: post.color,
  region: post.region
});

// Returns: { thumbnail: Buffer, medium: Buffer, large: Buffer, hash: String }
```

**Configuration:**

```bash
# .env
GOOGLE_MAPS_API_KEY=your-api-key-here
```

Get your API key: https://console.cloud.google.com/google/maps-apis/credentials

Enable these APIs:
- Maps Static API
- Maps JavaScript API (for frontend)

---

## Caching Strategy

### Redis Implementation

**File:** `backend/shared/utils/redis.js`

**Cache Patterns:**

1. **Single Post** - 30 minutes
   ```
   Key: post:{postId}
   Value: {id, title, user, likeCount, ...}
   TTL: 1800s
   ```

2. **User Posts** - 5 minutes
   ```
   Key: posts:user:{userId}:{cursor}
   Value: {posts: [...], pagination: {...}}
   TTL: 300s
   ```

3. **Feed** - Invalidated on new post
   ```
   Key: feed:{userId}:{cursor}
   Value: {posts: [...], pagination: {...}}
   TTL: Until invalidation
   ```

4. **Map Images** - 30 days
   ```
   Key: map:{waypointsHash}
   Value: https://storage.supabase.co/...
   TTL: 2592000s
   ```

5. **Comments** - 2 minutes
   ```
   Key: comments:{postId}:{page}
   Value: {comments: [...], pagination: {...}}
   TTL: 120s
   ```

**Cache Invalidation:**

```javascript
// Delete specific keys
await cache.del(`post:${postId}`);

// Delete pattern (e.g., all feeds)
await cache.delPattern('feed:*');

// Delete multiple patterns
await Promise.all([
  cache.delPattern('feed:*'),
  cache.delPattern(`posts:user:${userId}:*`)
]);
```

**Helper Functions:**

```javascript
const { cache } = require('/app/shared/utils/redis');

// Get
const data = await cache.get('key');

// Set with TTL (seconds)
await cache.set('key', data, 3600);

// Delete
await cache.del('key');

// Delete pattern
await cache.delPattern('pattern:*');
```

---

## Rate Limiting

### Multi-Tier Rate Limiting

**Files:**
- `backend/shared/middleware/rateLimiter.js` - General rate limiting
- `backend/shared/middleware/mapRateLimiter.js` - Map generation specific

**General Limits:**

| Tier | Limit | Endpoints |
|------|-------|-----------|
| **Lenient** | 100 req/15min | Read operations (GET) |
| **Moderate** | 50 req/15min | Update operations (PUT) |
| **Strict** | 20 req/15min | Delete operations |
| **Create** | 20 req/hour | Create operations (POST) |

**Map Generation Limits (3-Tier Protection):**

1. **IP-based:** 20 maps/hour per IP
2. **User-based:** 50 maps/hour per user
3. **Global:** 500 maps/hour total

This prevents:
- Individual abuse (IP limit)
- Account abuse (user limit)
- Total quota exhaustion (global limit)

**Max possible cost if all limits hit:**
```
500 maps/hour × 24 hours × 30 days = 360,000 maps/month
360,000 × $0.002 = $720/month (theoretical max)

Realistic usage: ~1000-5000 maps/month = $2-10/month
```

**Usage:**

```javascript
const { lenientLimiter, moderateLimiter, strictLimiter, createLimiter } = require('/app/shared/middleware/rateLimiter');
const { mapGenerationRateLimiter } = require('/app/shared/middleware/mapRateLimiter');

// Apply to routes
router.get('/posts', lenientLimiter, getPosts);
router.post('/create', createLimiter, mapGenerationRateLimiter(), createPost);
router.delete('/posts/:id', strictLimiter, deletePost);
```

---

## External Services

### Supabase Platform (Self-Hosted)

**Version:** Latest stable
**Components:**
- PostgreSQL 15.8 - Primary database
- GoTrue v2.177.0 - Authentication
- PostgREST v12.2.12 - Auto-generated REST API
- Storage API v1.13.1 - File storage
- Kong 2.8.1 - API Gateway

**Configuration:**
```bash
SUPABASE_PUBLIC_URL=http://localhost:8000
SUPABASE_ANON_KEY=<from supabase dashboard>
SUPABASE_SERVICE_KEY=<from supabase dashboard>
```

**Storage Buckets:**
- `profile-pictures` - User avatars
- `route-images` - Large map images
- `route-images-optimized` - Thumbnail/medium sizes

**Access Policies:**
- Public read for profile pictures and route images
- Authenticated write for own content
- Service role for backend operations

### Redis

**Version:** 7.x
**Purpose:** Caching and rate limiting
**Configuration:**
```bash
REDIS_URL=redis://redis:6379
```

**Persistence:** Configured with AOF for data durability

### Google Maps API

**APIs Used:**
- Maps Static API - Route image generation
- Maps JavaScript API - Frontend interactive maps

**Setup:**
1. Get API key from Google Cloud Console
2. Enable Maps Static API and Maps JavaScript API
3. Add to `.env`:
   ```bash
   GOOGLE_MAPS_API_KEY=your-api-key
   ```

**Cost Estimation:**
- Static API: $0.002 per request
- With caching: ~$1-5/month for typical usage

### ioredis

**Version:** 5.3.2
**Why not node-redis?** Required by Bull/BullMQ for job queues
**Configuration:** See `backend/shared/utils/redis.js`

---

## Reusable Components

### Shared Middleware

**Location:** `backend/shared/middleware/`

**auth.js** - Authentication
```javascript
const { verifyAuth, verifyOwnership, optionalAuth } = require('/app/shared/middleware/auth');

// Protect route
router.post('/create', verifyAuth, controller.create);

// Verify ownership
router.put('/:id', verifyAuth, verifyOwnership('id'), controller.update);

// Optional auth (public + personalized)
router.get('/feed', optionalAuth, controller.getFeed);
```

**validator.js** - Schema validation with Zod
```javascript
const { validate, uuidSchema, paginationSchema } = require('/app/shared/middleware/validator');

router.get('/posts', validate({ query: paginationSchema }), getPosts);
```

**errorHandler.js** - Async error handling
```javascript
const { asyncHandler } = require('/app/shared/middleware/errorHandler');

router.get('/posts', asyncHandler(async (req, res) => {
  // No try-catch needed, errors are caught automatically
  const posts = await db.post.findMany();
  res.json(posts);
}));
```

**rateLimiter.js** - Rate limiting
```javascript
const { lenientLimiter, createLimiter } = require('/app/shared/middleware/rateLimiter');

router.get('/posts', lenientLimiter, getPosts);
router.post('/create', createLimiter, createPost);
```

### Shared Utilities

**Location:** `backend/shared/utils/`

**db.js** - Prisma client singleton
```javascript
const { db } = require('/app/shared/utils/db');

const users = await db.user.findMany();
```

**redis.js** - Redis client with helpers
```javascript
const { cache } = require('/app/shared/utils/redis');

const data = await cache.get('key');
await cache.set('key', data, 3600);
await cache.delPattern('feed:*');
```

**logger.js** - Winston logger
```javascript
const logger = require('/app/shared/utils/logger');

logger.info('User created', { userId: '123' });
logger.error('Database error', { error: err.message });
```

**googleMapsRenderer.js** - Map generation
```javascript
const { renderMapFromPost, calculateWaypointsHash } = require('/app/shared/utils/googleMapsRenderer');

const images = await renderMapFromPost({ waypoints, color, region });
// Returns: { thumbnail, medium, large, hash }
```

**storageService.js** - Supabase Storage client
```javascript
const { uploadRouteImage, uploadProfilePicture } = require('/app/shared/utils/storageService');

const result = await uploadRouteImage(imageBuffer, userId, postId);
// Returns: { publicUrl, path }
```

---

## Deployment

### Prerequisites

- VPS with Docker installed (recommended: 2 CPU, 4GB RAM)
- Domain name pointed to VPS
- HTTPS certificate (Let's Encrypt via Caddy)

### Production Environment Setup

1. **Clone repository on server**
   ```bash
   git clone <repo-url>
   cd MapPaletteV2
   ```

2. **Configure production environment**
   ```bash
   cp .env.example .env
   nano .env
   ```

   Update:
   - `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_KEY` (generate via Supabase CLI)
   - `GOOGLE_MAPS_API_KEY`
   - `INTERNAL_SERVICE_KEY` (generate random secret)
   - Set `NODE_ENV=production`

3. **Run deployment script**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

   The script will:
   - Build all Docker images
   - Start services with production configs
   - Run database migrations
   - Setup automated backups
   - Configure monitoring

### Manual Deployment Steps

```bash
# Build images
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Run migrations
docker compose exec post-service npx prisma migrate deploy

# Check logs
docker compose logs -f
```

### Health Checks

All services expose `/health` endpoint:

```bash
curl http://localhost:3001/health  # user-service
curl http://localhost:3002/health  # post-service
curl http://localhost:3003/health  # interaction-service
# ... etc
```

### Monitoring

**Logs:**
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f user-service

# Error logs only
docker compose logs -f | grep ERROR
```

**Metrics:**
- Prometheus metrics available at `/metrics` on each service
- Configure Grafana for visualization (optional)

### Backup

**Automated (via deploy.sh):**
- Daily database backups
- Retention: 7 days
- Location: `/backups/`

**Manual:**
```bash
# Backup database
docker compose exec supabase-db pg_dump -U postgres postgres > backup-$(date +%Y%m%d).sql

# Restore database
docker compose exec -T supabase-db psql -U postgres postgres < backup-20251118.sql

# Backup Supabase Storage
# (Files are stored in Supabase Storage, backed up via Supabase)
```

### Scaling

**Horizontal Scaling:**

Each service can be scaled independently:

```yaml
# docker-compose.prod.yml
services:
  post-service:
    deploy:
      replicas: 3
```

**Load Balancing:**

Configure Kong or Nginx to distribute requests across replicas.

**Database Connection Pooling:**

Prisma automatically pools connections. Configure via `DATABASE_URL`:

```
postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=10
```

### SSL/HTTPS

Use Caddy (included) for automatic HTTPS:

```
# Caddyfile
your-domain.com {
    reverse_proxy frontend:3000
}

api.your-domain.com {
    reverse_proxy kong:8000
}
```

Caddy automatically obtains and renews Let's Encrypt certificates.

---

## Migration Notes

### Firebase to Supabase Migration

**Completed:** November 2025

**What Changed:**

1. **Authentication**
   - ❌ Firebase Auth → ✅ Supabase Auth
   - JWT tokens remain compatible
   - User IDs migrated

2. **Database**
   - ❌ Firestore (NoSQL) → ✅ PostgreSQL (SQL)
   - ORM: Prisma
   - All relationships properly defined
   - Cascade deletes configured

3. **Storage**
   - ❌ Firebase Storage → ✅ Supabase Storage
   - Same bucket structure
   - Public URLs maintained

4. **Features Added**
   - Redis caching (10x performance boost)
   - Rate limiting
   - Batch operations
   - Google Maps Static API
   - Comprehensive logging

**Migration Script:**

Located at `backend/scripts/migrate/`

```bash
# Export from Firebase
cd backend/scripts/migrate
npm install
node 1-export-from-firebase.js

# Transform data
node 2-transform-data.js

# Import to PostgreSQL (via Prisma)
# Data is output to /tmp/transformed-data.json
# Import via custom script or Prisma seed
```

**Verification:**

Run migration audit:
```bash
npm run audit-migration
```

All features verified working with Supabase (see audit report in commit history).

### Breaking Changes

**None** - API endpoints remain unchanged. Frontend requires no modifications.

### Rollback Plan

If rollback needed:

1. Restore Firebase data from backup
2. Revert to previous commit
3. Redeploy

**Note:** V2 is production-ready and tested. Rollback should not be necessary.

---

## Common Tasks

### Adding a New Service

1. Create service directory
   ```bash
   mkdir -p backend/services/atomic/my-service
   cd backend/services/atomic/my-service
   npm init -y
   ```

2. Install dependencies
   ```bash
   npm install express dotenv
   ```

3. Create service structure
   ```
   my-service/
   ├── src/
   │   └── index.js
   ├── controllers/
   │   └── myController.js
   ├── routes/
   │   └── myRoutes.js
   ├── Dockerfile
   └── package.json
   ```

4. Add to docker-compose.yml
   ```yaml
   my-service:
     build: ./services/atomic/my-service
     ports:
       - "3009:5000"
     env_file:
       - .env
     environment:
       - PORT=5000
     networks:
       - mappalette-network
   ```

5. Use shared utilities
   ```javascript
   const { db } = require('/app/shared/utils/db');
   const { cache } = require('/app/shared/utils/redis');
   const { verifyAuth } = require('/app/shared/middleware/auth');
   ```

### Adding a New Database Table

1. Edit `backend/shared/prisma/schema.prisma`
   ```prisma
   model NewTable {
     id        String   @id @default(uuid())
     userId    String
     data      String
     createdAt DateTime @default(now())
     
     user      User     @relation(fields: [userId], references: [id])
     
     @@index([userId])
     @@map("new_table")
   }
   ```

2. Create migration
   ```bash
   cd backend/shared
   npx prisma migrate dev --name add_new_table
   ```

3. Generate client
   ```bash
   npx prisma generate
   ```

4. Use in code
   ```javascript
   const { db } = require('/app/shared/utils/db');
   
   const items = await db.newTable.findMany();
   ```

### Adding a New API Endpoint

1. Add to controller
   ```javascript
   // controllers/myController.js
   const myEndpoint = async (req, res) => {
     const data = await db.myTable.findMany();
     res.json(data);
   };
   ```

2. Add to routes
   ```javascript
   // routes/myRoutes.js
   const { verifyAuth } = require('/app/shared/middleware/auth');
   const { lenientLimiter } = require('/app/shared/middleware/rateLimiter');
   
   router.get('/data', lenientLimiter, verifyAuth, myController.myEndpoint);
   ```

3. Test
   ```bash
   curl -H "Authorization: Bearer <token>" http://localhost:3001/api/data
   ```

---

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker compose logs

# Check if ports are already in use
lsof -i :3001
lsof -i :5432

# Rebuild images
docker compose build --no-cache

# Fresh start
docker compose down -v
docker compose up -d
```

### Database Connection Issues

```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Check if Postgres is running
docker compose ps supabase-db

# Test connection
docker compose exec supabase-db psql -U postgres -c "SELECT 1"

# Check Prisma client
cd backend/shared
npx prisma generate
```

### Redis Issues

```bash
# Check if Redis is running
docker compose ps redis

# Test connection
docker compose exec redis redis-cli ping
# Should return: PONG

# Clear Redis cache
docker compose exec redis redis-cli FLUSHALL
```

### Google Maps Not Working

1. Verify API key in `.env`
2. Check API is enabled in Google Cloud Console
3. Check rate limits in logs
4. Verify billing is enabled

```bash
# Test map generation
curl -X POST http://localhost:3002/api/create/user-id \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "waypoints": "[{\"lat\":1.3521,\"lng\":103.8198}]",
    "color": "#FF0000",
    "region": "Test",
    "distance": 1.0
  }'
```

---

## Performance Optimization

### Database Queries

- Use `select` to fetch only needed fields
- Use `include` sparingly (joins are expensive)
- Always add indexes for filtered/sorted fields
- Use cursor pagination for large datasets

**Example:**
```javascript
// Bad
const posts = await db.post.findMany({
  include: { user: true, likes: true, comments: true }
});

// Good
const posts = await db.post.findMany({
  select: {
    id: true,
    title: true,
    user: { select: { id: true, username: true } },
    _count: { select: { likes: true, comments: true } }
  }
});
```

### Caching

- Cache frequently accessed data
- Use appropriate TTLs
- Invalidate on updates
- Use patterns for batch invalidation

### Rate Limiting

- Protect expensive operations (map generation)
- Use tiered limits based on operation cost
- Monitor rate limit hits

---

## Security Best Practices

1. **Never commit secrets** - Use `.env` files
2. **Validate all input** - Use Zod schemas
3. **Use prepared statements** - Prisma prevents SQL injection
4. **Verify ownership** - Use `verifyOwnership` middleware
5. **Rate limit all endpoints** - Prevent abuse
6. **Use HTTPS in production** - Caddy handles this
7. **Keep dependencies updated** - Run `npm audit`
8. **Sanitize user input** - Especially for comments/titles
9. **Use service keys** - For inter-service communication
10. **Log security events** - Monitor for anomalies

---

## Additional Resources

- **Prisma Docs:** https://www.prisma.io/docs
- **Supabase Docs:** https://supabase.com/docs
- **Redis Docs:** https://redis.io/docs
- **Google Maps API:** https://developers.google.com/maps
- **Express Best Practices:** https://expressjs.com/en/advanced/best-practice-security.html

---

**Last Updated:** November 18, 2025

For questions or issues, check the logs first:
```bash
docker compose logs -f | grep ERROR
```
