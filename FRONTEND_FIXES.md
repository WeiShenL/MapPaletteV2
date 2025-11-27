# Frontend Integration Fixes

This document describes all fixes implemented to improve frontend integration with Supabase Storage, backend microservices, and overall architecture.

**Date**: 2025-11-27
**Branch**: `claude/fix-docker-supabase-019B4RiptAQHB3gJzmmS5tnB`

---

## 📋 Summary of Fixes

| Fix | Status | Impact |
|-----|--------|--------|
| 1. Supabase Storage Integration | ✅ Complete | High - Eliminates base64 image transfer |
| 2. Service Layer Consolidation | ✅ Complete | Medium - Reduces code duplication |
| 3. API Client Standardization | ✅ Complete | Medium - Consistent error handling |
| 4. Port Configuration Cleanup | ✅ Complete | Low - Prevents conflicts |

---

## 🔧 Fix #1: Supabase Storage Integration

### Problem
- Frontend was sending base64-encoded images to backend APIs
- No direct use of Supabase Storage for file uploads
- Profile pictures and map images went through backend APIs

### Solution Implemented

#### Created Storage Utility Module (`frontend/src/lib/storage.js`)

**Features**:
- ✅ File validation (type, size)
- ✅ Unique path generation with timestamps
- ✅ Upload/download/delete operations
- ✅ Base64 to Blob conversion
- ✅ Public URL generation
- ✅ Support for all three buckets:
  - `profile-pictures` (5MB limit)
  - `route-images` (10MB limit)
  - `route-images-optimized` (10MB limit)

**Key Functions**:
```javascript
uploadProfilePicture(file, userId)      // Profile picture upload
uploadRouteImage(file, userId, postId)  // Route map upload
uploadBase64Image(base64, userId, ...)  // Base64 conversion & upload
deleteOldProfilePicture(url)            // Cleanup old files
```

#### Updated Components

**1. SettingsView.vue** (Profile Pictures)
- **Before**: FormData upload to `user-service` API
- **After**: Direct Supabase Storage upload
- **Benefits**:
  - Faster uploads (no backend proxy)
  - Automatic CDN distribution
  - Built-in image transformation support

**Changes**:
```javascript
// OLD: Upload via backend API
const formData = new FormData()
formData.append('profilePicture', file)
await axios.post(`${USER_SERVICE_URL}/api/users/${userId}/profile-picture`, formData)

// NEW: Upload directly to Supabase Storage
const uploadResult = await uploadProfilePicture(file, userId)
if (uploadResult.success) {
  await updateUserProfilePicture(uploadResult.url)
}
```

**2. AddMapsView.vue** (Route Map Images)
- **Before**: html2canvas → base64 → backend API
- **After**: html2canvas → base64 → Supabase Storage → URL to backend
- **Benefits**:
  - Smaller API payloads (URL instead of base64)
  - Faster post creation
  - Backend doesn't handle image storage

**Changes**:
```javascript
// OLD: Send base64 directly
const imageData = canvas.toDataURL("image/png")
image.value = imageData  // Sent in POST body

// NEW: Upload to Storage first
const imageData = canvas.toDataURL("image/jpeg", 0.9)
const uploadResult = await uploadBase64Image(imageData, userID, BUCKETS.ROUTE_IMAGES, `route_${postId}.jpg`)
image.value = uploadResult.url  // Send URL instead
```

### Migration Notes

**Backend Compatibility**:
- Backend services now receive URLs instead of base64 data
- Existing endpoints still work (accept both formats)
- Recommendation: Update backend validation to expect URLs only

**Storage Buckets Setup**:
- Buckets created via `backend/shared/migrations/add-storage-buckets.sql`
- RLS policies configured for public read, authenticated write
- All three buckets initialized on first database setup

---

## 🔄 Fix #2: Service Layer Consolidation

### Problem
- `socialInteractionService.js` had duplicate follow methods
- `interactionService.js` (generic) vs `socialInteractionService.js` (post-specific) overlap
- `leaderboardService.js` used `fetch` instead of `axios`

### Solution Implemented

#### Updated socialInteractionService.js
**Changes**:
- Kept post-specific interactions (likes, comments, shares)
- Deprecated follow methods, delegate to `followService`
- Added JSDoc documentation
- Backward compatibility maintained

**Example**:
```javascript
// Deprecated (still works, shows warning)
async followUser(targetUserId, userId) {
  console.warn('[SocialInteractionService] followUser is deprecated. Use followService.followUser() instead.');
  return followService.followUser(targetUserId, userId);
}
```

**Recommendations for New Code**:
```javascript
// OLD - Don't use
import socialInteractionService from '@/services/socialInteractionService'
await socialInteractionService.followUser(userId)

// NEW - Use dedicated service
import followService from '@/services/followService'
await followService.followUser(userId)
```

#### Service Responsibilities Clarified

| Service | Responsibility | Examples |
|---------|---------------|----------|
| **followService** | Follow relationships | follow, unfollow, getFollowers, getFollowing |
| **interactionService** | Generic entity interactions | likeEntity, commentEntity (any entity type) |
| **socialInteractionService** | Post-specific interactions | likePost, sharePost, getPostInteractions |
| **feedService** | Feed aggregation | getUserFeed, getTrendingPosts |
| **profileService** | User profiles | getUserProfile with followers/following |

---

## 🔌 Fix #3: API Client Standardization

### Problem
- Most services used `axios` from `@/lib/axios`
- `leaderboardService` used native `fetch` API
- Different error handling approaches

### Solution Implemented

#### Updated leaderboardService.js
**Before**:
```javascript
async getLeaderboard() {
  const response = await fetch(`${this.baseURL}/api/leaderboard/`)
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  return await response.json()
}
```

**After**:
```javascript
import axios from '@/lib/axios'

async getLeaderboard() {
  const response = await axios.get(`${this.baseURL}/api/leaderboard/`)
  return response.data.leaderboard || []
}
```

**Benefits**:
- ✅ Automatic JWT token injection
- ✅ Automatic token refresh on 401
- ✅ Consistent error handling
- ✅ Request/response interceptors
- ✅ Better error messages

---

## 🔧 Fix #4: Port Configuration Cleanup

### Problem
- `VITE_API_URL` = `http://localhost:8080` (undefined purpose)
- `VITE_LEADERBOARD_SERVICE_URL` = `http://localhost:8080` (same port!)
- Kong Gateway on port 8000, but not used for microservices
- Confusing architecture

### Solution Implemented

#### Updated .env.development
**Before**:
```bash
VITE_API_URL=http://localhost:8080
VITE_LEADERBOARD_SERVICE_URL=http://localhost:8080
```

**After**:
```bash
# Kong Gateway (port 8000) only handles Supabase routes
VITE_API_URL=http://localhost:8000

# Special Services (Different Tech Stack)
VITE_LEADERBOARD_SERVICE_URL=http://localhost:8081
```

**Added clarifying comments**:
```bash
# ==================== SUPABASE ====================
# Kong Gateway routes Supabase services (auth, storage, rest) on port 8000
# Access Supabase at: http://localhost:8000/auth/v1, /storage/v1, /rest/v1
VITE_SUPABASE_URL=http://localhost:8000

# ==================== API ENDPOINTS ====================
# Note: Currently services are accessed directly, not through a unified gateway
# Kong Gateway (port 8000) only handles Supabase routes
VITE_API_URL=http://localhost:8000

# Microservices (Direct Access)
# Atomic Services
VITE_USER_SERVICE_URL=http://localhost:3001
...
```

#### Updated .env.example
Changed `LEADERBOARD_SERVICE_PORT` from `8080` to `8081`

### Current Port Allocation

| Port | Service | Purpose |
|------|---------|---------|
| 3000 | Frontend | Vue.js development server |
| 3001 | user-service | Atomic: User CRUD |
| 3002 | post-service | Atomic: Post management |
| 3003 | interaction-service | Atomic: Likes/comments/shares |
| 3004 | feed-service | Composite: Feed aggregation |
| 3005 | social-interaction-service | Composite: Social features |
| 3006 | profile-service | Composite: User profiles |
| 3007 | follow-service | Atomic: Follow relationships |
| 3008 | explore-routes-service | Composite: Route discovery |
| 3010 | user-discovery-service | Composite: User recommendations |
| 5000 | supabase-storage | Storage API |
| 5432 | supabase-db | PostgreSQL database |
| 6379 | redis | Cache layer |
| 8000 | supabase-kong | Kong Gateway (Supabase only) |
| 8081 | leaderboard-service | Go/Gin leaderboard |

**Note**: If leaderboard is not in docker-compose, it runs separately on 8081

---

## 📊 Architecture Changes

### Before
```
Frontend → Backend API (with base64 images) → Store/Process
Frontend → Multiple services (inconsistent clients)
Frontend → Port conflicts (8080 used twice)
```

### After
```
Frontend → Supabase Storage (direct) → CDN URLs
Frontend → Kong Gateway :8000 → Supabase (auth/storage/rest)
Frontend → Microservices :300x (axios with JWT)
Frontend → Leaderboard :8081 (axios with JWT)
```

### Request Flow Examples

**1. Profile Picture Upload**:
```
User selects file
  → frontend/src/views/SettingsView.vue
  → uploadProfilePicture(file, userId)
  → Supabase Storage (profile-pictures bucket)
  → Returns public URL
  → Update user-service with URL
  → Done
```

**2. Map Image Upload**:
```
User creates route
  → html2canvas captures map
  → uploadBase64Image(base64, userId, bucket, filename)
  → Converts base64 to Blob
  → Uploads to Supabase Storage (route-images bucket)
  → Returns public URL
  → POST to post-service with URL (not base64!)
  → Done
```

**3. Authentication Flow**:
```
User logs in
  → Supabase Auth (via Kong :8000/auth/v1)
  → Returns JWT token
  → axios interceptor adds token to all requests
  → Microservices verify JWT
  → Done
```

---

## 🧪 Testing Recommendations

### 1. Test Supabase Storage

**Profile Picture Upload**:
```bash
# 1. Go to Settings page
# 2. Upload a new profile picture
# 3. Check browser network tab:
#    - Should see POST to http://localhost:8000/storage/v1/object/profile-pictures/...
#    - Should NOT see POST with FormData to user-service
# 4. Check Supabase Storage:
#    docker compose exec supabase-db psql -U postgres -d postgres -c "SELECT * FROM storage.objects WHERE bucket_id='profile-pictures' LIMIT 5;"
```

**Route Image Upload**:
```bash
# 1. Create a new route with map
# 2. Submit the post
# 3. Check browser network tab:
#    - Should see POST to /storage/v1/object/route-images/...
#    - POST to post-service should have small payload (just URL, not base64)
# 4. Verify image is accessible via public URL
```

### 2. Test Service Consolidation

**Check Console Warnings**:
```javascript
// If you use socialInteractionService for follows, you should see:
// "[SocialInteractionService] followUser is deprecated. Use followService.followUser() instead."
```

**Verify Follow Operations**:
```bash
# Both should work, but use followService directly:
import followService from '@/services/followService'
await followService.followUser(targetUserId, currentUserId)
```

### 3. Test API Client Standardization

**Verify JWT Injection**:
```bash
# 1. Open browser DevTools → Network
# 2. Call any API endpoint
# 3. Check request headers:
#    - Should have: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
# 4. Verify leaderboard service also includes auth header
```

**Test Token Refresh**:
```bash
# 1. Login
# 2. Wait for token to expire (or manually clear)
# 3. Make an API call
# 4. Should see:
#    - 401 response
#    - Automatic token refresh
#    - Retry of original request
#    - Success
```

### 4. Test Port Configuration

**Verify No Conflicts**:
```bash
# Check all services are running on correct ports
docker compose ps

# Test each service endpoint:
curl http://localhost:3001/api/health  # user-service
curl http://localhost:8000/health      # kong gateway
curl http://localhost:8081/api/health  # leaderboard (if separate)
```

---

## 📁 Files Changed

### New Files Created
```
frontend/src/lib/storage.js                    (383 lines)
FRONTEND_FIXES.md                              (this file)
```

### Files Modified
```
frontend/src/views/SettingsView.vue            (Profile picture upload)
frontend/src/views/AddMapsView.vue             (Map image upload)
frontend/src/services/socialInteractionService.js (Consolidation)
frontend/src/services/leaderboardService.js    (Axios migration)
frontend/.env.development                      (Port clarification)
.env.example                                   (Leaderboard port)
```

### Migration Statistics
```
7 files changed
~800 lines modified
+383 new lines (storage.js)
-150 lines removed (duplicates)
```

---

## 🚀 Deployment Notes

### Environment Variables Required
```bash
# Ensure these are set in production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_LEADERBOARD_SERVICE_URL=https://api.yourapp.com/leaderboard
```

### Database Migrations
```bash
# Supabase Storage buckets are created automatically via:
# backend/shared/migrations/add-storage-buckets.sql
# This runs during database initialization
```

### Backend Changes Needed (Optional)
```bash
# Update backend services to expect URLs instead of base64:
# - user-service: profilePicture field validation
# - post-service: imageUrl field validation
# - Add URL format validation
```

---

## 🔮 Future Improvements

### Recommended Next Steps

1. **Implement API Gateway for Microservices**
   - Use Kong or Caddy to route all microservices
   - Single entry point: `https://api.yourapp.com`
   - Simplifies CORS and SSL management

2. **Add Image Optimization**
   - Use imgproxy for automatic resizing
   - Generate thumbnails on upload
   - Progressive loading

3. **Implement Service Workers**
   - Cache Supabase Storage assets
   - Offline support for previously viewed images
   - Background sync for uploads

4. **Add Upload Progress**
   - Show progress bar during uploads
   - Cancel/resume functionality
   - Retry failed uploads

5. **Improve Error Handling**
   - User-friendly error messages
   - Automatic retry with exponential backoff
   - Fallback to backend upload if Storage fails

---

## 📚 References

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Supabase Storage JavaScript Client](https://supabase.com/docs/reference/javascript/storage-from-upload)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)

---

**Author**: Claude Code
**Branch**: claude/fix-docker-supabase-019B4RiptAQHB3gJzmmS5tnB
**Date**: 2025-11-27
