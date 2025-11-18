# MapPalette V2 - Full Stack Testing Guide

**Date**: November 18, 2025
**Purpose**: Comprehensive testing procedures for complete frontend-backend integration

---

## 🚨 TESTING ENVIRONMENT LIMITATIONS

**What was tested in Claude environment:**
- ✅ Frontend build compilation (npm run build)
- ✅ Development server startup (npm run dev)
- ✅ File syntax and imports validation
- ✅ Code analysis (composables, services, components)
- ✅ Firebase→Supabase migration completeness
- ✅ Environment variable configuration

**What CANNOT be tested in Claude environment:**
- ❌ Docker Compose full stack (Docker not available)
- ❌ Actual API communication (frontend→backend)
- ❌ Supabase authentication flow (requires runtime)
- ❌ Database operations (requires PostgreSQL)
- ❌ Service integration (requires all microservices running)

**YOU MUST TEST THESE MANUALLY** - This guide shows you how.

---

## Prerequisites

1. **Docker & Docker Compose** installed
2. **Node.js 18+** (for local testing)
3. **Google Maps API key** (optional but recommended)
4. **At least 8GB RAM** for all services

---

## Quick Test Script

We've created `test-full-stack.sh` that automates the testing process.

### Run the automated tests:

```bash
cd /home/user/MapPaletteV2
chmod +x test-full-stack.sh
./test-full-stack.sh
```

**What it does:**
1. Stops any existing containers
2. Builds all Docker images
3. Starts all services
4. Waits for services to be healthy
5. Tests each service endpoint
6. Tests frontend accessibility
7. Generates a test report

---

## Manual Testing Procedures

If you prefer to test manually, follow these steps:

### Step 1: Environment Setup

```bash
# Navigate to project root
cd /home/user/MapPaletteV2

# Verify .env file exists
ls -la .env

# If needed, copy from example
cp .env.example .env

# Edit .env with your values (especially VITE_GOOGLE_MAPS_API_KEY)
nano .env
```

**Critical environment variables:**
- `POSTGRES_PASSWORD` - Database password
- `JWT_SECRET` - JWT signing secret
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps API key (for map rendering)

### Step 2: Build Docker Images

```bash
# Build all services
docker compose build

# Or build specific services
docker compose build frontend
docker compose build user-service
docker compose build post-service
```

**Expected output:**
```
[+] Building 120.5s (25/25) FINISHED
 => [frontend internal] load build definition from Dockerfile
 => [frontend] => transferring dockerfile
 ...
 => [frontend] => writing image sha256:...
```

**If build fails:**
- Check for missing files
- Verify .env variables are set
- Check Dockerfile syntax
- Review error messages for missing dependencies

### Step 3: Start All Services

```bash
# Start all services in detached mode
docker compose up -d

# Or start with logs visible
docker compose up
```

**Services that should start:**
1. `mappalette-supabase-db` (PostgreSQL)
2. `mappalette-supabase-auth` (Gotrue)
3. `mappalette-supabase-rest` (PostgREST)
4. `mappalette-supabase-storage`
5. `mappalette-supabase-kong` (API Gateway)
6. `mappalette-redis`
7. `mappalette-user-service`
8. `mappalette-post-service`
9. `mappalette-interaction-service`
10. `mappalette-follow-service`
11. `mappalette-feed-service`
12. `mappalette-frontend`
13. `mappalette-caddy` (Reverse proxy)

### Step 4: Verify Services are Running

```bash
# Check service status
docker compose ps

# All services should show "Up" or "Up (healthy)"
```

**Expected output:**
```
NAME                            STATUS
mappalette-frontend             Up
mappalette-user-service         Up (healthy)
mappalette-post-service         Up (healthy)
mappalette-supabase-db          Up (healthy)
...
```

**If services are not healthy:**
```bash
# View logs for specific service
docker compose logs frontend
docker compose logs user-service
docker compose logs supabase-db

# View all logs
docker compose logs -f
```

### Step 5: Test Backend Services

Test each microservice endpoint:

```bash
# Test User Service (port 3001)
curl http://localhost:3001/health
# Expected: {"status":"ok","service":"user-service"}

# Test Post Service (port 3002)
curl http://localhost:3002/health
# Expected: {"status":"ok","service":"post-service"}

# Test Interaction Service (port 3003)
curl http://localhost:3003/health
# Expected: {"status":"ok","service":"interaction-service"}

# Test Feed Service (port 3004)
curl http://localhost:3004/health
# Expected: {"status":"ok","service":"feed-service"}

# Test Follow Service (port 3007)
curl http://localhost:3007/health
# Expected: {"status":"ok","service":"follow-service"}

# Test Supabase Kong Gateway (port 8000)
curl http://localhost:8000/
# Expected: {"message":"no Route matched..."}

# Test PostgreSQL
docker compose exec supabase-db pg_isready -U postgres
# Expected: /var/run/postgresql:5432 - accepting connections

# Test Redis
docker compose exec redis redis-cli ping
# Expected: PONG
```

### Step 6: Test Frontend

```bash
# Check frontend is running
curl -I http://localhost:3000
# Expected: HTTP/1.1 200 OK

# Open in browser
# Mac: open http://localhost:3000
# Linux: xdg-open http://localhost:3000
# Windows: start http://localhost:3000
```

**Frontend should display:**
- MapPalette landing page
- No console errors
- No network errors in DevTools

### Step 7: Test Complete User Flow

This is the CRITICAL test - actual user interaction:

#### 7.1 Create Account

1. Navigate to http://localhost:3000/signup
2. Fill in:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `Test123!@#`
   - Confirm Password: `Test123!@#`
3. Click "Sign Up"

**Expected:**
- ✅ No errors in console
- ✅ Redirect to `/feed` or `/homepage`
- ✅ Toast notification: "Account created successfully!"
- ✅ User is logged in (check navbar shows username)

**If fails:**
- Check browser console for errors
- Check Supabase auth logs: `docker compose logs supabase-auth`
- Check user-service logs: `docker compose logs user-service`
- Verify SUPABASE_ANON_KEY is set correctly in .env

#### 7.2 Login

1. Logout (if logged in)
2. Navigate to http://localhost:3000/login
3. Enter:
   - Email: `test@example.com`
   - Password: `Test123!@#`
4. Click "Login"

**Expected:**
- ✅ No errors
- ✅ Redirect to `/feed` or `/homepage`
- ✅ Toast: "Welcome back!"
- ✅ Navbar shows username

**If fails:**
- Check Supabase auth logs
- Verify JWT_SECRET matches in all services
- Check browser localStorage for auth tokens

#### 7.3 Create Post

1. Navigate to http://localhost:3000/create-route
2. Fill in:
   - Title: "Test Route"
   - Description: "Testing post creation"
   - Select location on map
3. Click "Create Post"

**Expected:**
- ✅ No errors
- ✅ Map loads correctly (requires GOOGLE_MAPS_API_KEY)
- ✅ Post created successfully
- ✅ Redirect to `/homepage` or `/feed`
- ✅ Toast: "Post created successfully!"

**If fails:**
- Check post-service logs: `docker compose logs post-service`
- Check browser Network tab for failed API calls
- Verify POST request to `http://user-service:5000/api/create/...` succeeds
- Check if JWT token is being sent in Authorization header

#### 7.4 View Feed

1. Navigate to http://localhost:3000/homepage
2. Scroll through posts

**Expected:**
- ✅ Posts load and display
- ✅ Infinite scroll works (loads more on scroll)
- ✅ Images lazy load
- ✅ No console errors

**If fails:**
- Check feed-service logs: `docker compose logs feed-service`
- Check browser Network tab
- Verify TanStack Query is fetching data

#### 7.5 Like Post

1. Click the heart icon on a post

**Expected:**
- ✅ Heart fills with red color
- ✅ Like count increments by 1
- ✅ No console errors
- ✅ Optimistic update (instant UI change)

**If fails:**
- Check interaction-service logs
- Check browser Network tab for POST/DELETE to `/api/likes`
- Verify JWT is sent with request

#### 7.6 Comment on Post

1. Click comment button on a post
2. Enter comment text
3. Submit comment

**Expected:**
- ✅ Comment appears in list
- ✅ Comment count increments
- ✅ No errors

**If fails:**
- Check interaction-service logs
- Verify POST to `/api/comments` succeeds

#### 7.7 View Profile

1. Click on username or navigate to http://localhost:3000/profile
2. View your profile

**Expected:**
- ✅ Profile loads with user info
- ✅ User's posts display
- ✅ Follower/following counts shown
- ✅ No errors

**If fails:**
- Check profile-service logs (if exists)
- Check user-service logs
- Verify API calls to get user data succeed

#### 7.8 Follow User

1. Navigate to another user's profile
2. Click "Follow" button

**Expected:**
- ✅ Button changes to "Unfollow"
- ✅ Follower count increments
- ✅ No errors

**If fails:**
- Check follow-service logs: `docker compose logs follow-service`
- Verify POST to `/api/follow` succeeds

#### 7.9 Logout

1. Click logout button
2. Confirm logout

**Expected:**
- ✅ Redirect to `/login`
- ✅ Toast: "Logged out successfully"
- ✅ LocalStorage cleared
- ✅ No auth token in subsequent requests

---

## Checklist: Complete Test Suite

Copy this checklist and mark items as you test:

### Backend Services
- [ ] PostgreSQL database is running and accepting connections
- [ ] Redis is running and responds to PING
- [ ] Supabase Auth service is healthy
- [ ] Supabase REST (PostgREST) is running
- [ ] Supabase Storage is running
- [ ] Kong API Gateway is running
- [ ] User Service responds to /health
- [ ] Post Service responds to /health
- [ ] Interaction Service responds to /health
- [ ] Feed Service responds to /health
- [ ] Follow Service responds to /health

### Frontend Build
- [ ] Frontend Docker image builds successfully
- [ ] Frontend container starts without errors
- [ ] Frontend accessible at http://localhost:3000
- [ ] No console errors on page load
- [ ] All environment variables injected correctly

### Authentication Flow
- [ ] Signup page loads
- [ ] Can create new account
- [ ] Account creation redirects to feed/homepage
- [ ] Login page loads
- [ ] Can login with created account
- [ ] Login redirects to feed/homepage
- [ ] Logout works correctly
- [ ] Protected routes redirect to login when not authenticated

### Post Management
- [ ] Create post page loads
- [ ] Google Maps loads correctly
- [ ] Can create new post
- [ ] Post appears in feed after creation
- [ ] Can view post details
- [ ] Can edit own post (if implemented)
- [ ] Can delete own post

### Social Interactions
- [ ] Can like a post
- [ ] Can unlike a post
- [ ] Like count updates correctly
- [ ] Can add comment to post
- [ ] Comment appears in comments list
- [ ] Comment count updates
- [ ] Can share post (copy link)

### Follow System
- [ ] Can view other user's profile
- [ ] Can follow another user
- [ ] Can unfollow a user
- [ ] Follower count updates
- [ ] Following count updates
- [ ] Following status persists after page refresh

### Feed & Discovery
- [ ] Homepage/feed loads posts
- [ ] Infinite scroll loads more posts
- [ ] Posts display correctly (image, title, description)
- [ ] Author info displays
- [ ] Timestamps display correctly ("2h ago", etc.)
- [ ] Tags display
- [ ] Location displays

### Performance
- [ ] Initial page load < 3 seconds
- [ ] Lazy images load as you scroll
- [ ] Infinite scroll is smooth
- [ ] No memory leaks (check DevTools Performance)
- [ ] No excessive API calls (check Network tab)

### Error Handling
- [ ] Invalid login shows error message
- [ ] Network errors show toast notifications
- [ ] 401 errors trigger logout/redirect to login
- [ ] Form validation works (email format, password strength)
- [ ] Empty states display correctly (no posts, no followers)

---

## Common Issues & Solutions

### Issue: Frontend shows "Cannot connect to backend"

**Solution:**
```bash
# Check if backend services are running
docker compose ps

# Check frontend environment variables
docker compose exec frontend env | grep VITE

# Verify service URLs in docker-compose.yml match internal service names
# Should be: http://user-service:5000 NOT http://localhost:3001
```

### Issue: "Supabase error: Invalid JWT"

**Solution:**
```bash
# Ensure JWT_SECRET matches in .env
# Restart all services
docker compose down
docker compose up -d
```

### Issue: "Google Maps not loading"

**Solution:**
```bash
# Check VITE_GOOGLE_MAPS_API_KEY is set
docker compose exec frontend env | grep GOOGLE

# Verify API key is valid in Google Cloud Console
# Enable Maps JavaScript API if not already enabled
```

### Issue: "Database connection error"

**Solution:**
```bash
# Check PostgreSQL is running
docker compose ps supabase-db

# Check connection string
docker compose exec user-service env | grep DATABASE_URL

# Check PostgreSQL logs
docker compose logs supabase-db
```

### Issue: Services fail to start

**Solution:**
```bash
# Check for port conflicts
netstat -an | grep -E "3001|3002|3003|3004|5432|6379|8000"

# Stop conflicting services or change ports in .env
# Rebuild and restart
docker compose down
docker compose build
docker compose up -d
```

---

## Performance Benchmarks

After completing functional tests, measure performance:

### Backend Response Times

```bash
# Test user service response time
time curl http://localhost:3001/health

# Should be < 100ms
```

### Frontend Load Time

1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Reload page (Cmd+R / Ctrl+R)
4. Check "Load" time at bottom

**Targets:**
- DOMContentLoaded: < 1s
- Load: < 3s
- Largest Contentful Paint: < 2.5s

### Lighthouse Audit

```bash
# Run Lighthouse audit
cd frontend
./lighthouse-audit.sh http://localhost:3000
```

**Target Scores:**
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 95+

---

## Cleanup After Testing

```bash
# Stop all services
docker compose down

# Remove all containers and volumes (DESTROYS DATA)
docker compose down -v

# Remove all images
docker compose down --rmi all
```

---

## Test Report Template

After testing, document your results:

```
# MapPalette V2 - Test Report
Date: [DATE]
Tester: [YOUR NAME]

## Environment
- OS: [macOS/Linux/Windows]
- Docker Version: [VERSION]
- Node Version: [VERSION]

## Test Results

### Backend Services
- PostgreSQL: [PASS/FAIL]
- Redis: [PASS/FAIL]
- Supabase Auth: [PASS/FAIL]
- User Service: [PASS/FAIL]
- Post Service: [PASS/FAIL]
- Interaction Service: [PASS/FAIL]
- Feed Service: [PASS/FAIL]
- Follow Service: [PASS/FAIL]

### Frontend
- Build: [PASS/FAIL]
- Loads: [PASS/FAIL]
- No console errors: [PASS/FAIL]

### User Flows
- Signup: [PASS/FAIL]
- Login: [PASS/FAIL]
- Create Post: [PASS/FAIL]
- Like Post: [PASS/FAIL]
- Comment: [PASS/FAIL]
- Follow User: [PASS/FAIL]
- Logout: [PASS/FAIL]

### Performance
- Frontend load time: [X]s
- Backend avg response: [X]ms
- Lighthouse Performance: [X]/100

## Issues Found
1. [Issue description]
   - Steps to reproduce
   - Expected vs Actual
   - Logs/Screenshots

## Conclusion
- Total tests: [X]
- Passed: [X]
- Failed: [X]
- Overall status: [PASS/FAIL]
```

---

## Next Steps After Successful Testing

1. ✅ Document any issues found
2. ✅ Fix critical bugs
3. ✅ Run Lighthouse audit
4. ✅ Deploy to staging environment
5. ✅ Perform UAT (User Acceptance Testing)
6. ✅ Deploy to production

---

**Good luck with testing! 🚀**
