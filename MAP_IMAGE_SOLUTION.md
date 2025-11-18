# Map Image Generation & Storage Solution

## Current State

### What's NOT Working:
- ❌ No Supabase Storage configured
- ❌ No map image generation/rendering
- ❌ No actual image upload functionality
- ❌ Map screenshots not being created from route data

### What IS Working:
- ✅ Route data stored (waypoints, color, region, distance)
- ✅ Image URLs stored in database (but images don't exist)
- ✅ Image optimization utilities ready (Sharp)

---

## Recommended Solution: Server-Side Map Rendering

### Technology Stack:

1. **Supabase Storage** - Image storage & CDN
2. **Puppeteer** - Headless browser for map screenshots
3. **Leaflet** - Open-source map rendering
4. **OpenStreetMap** - Free map tiles
5. **Sharp** - Image optimization (already implemented)

### Why This Stack?

**Supabase Storage:**
- ✅ Already using Supabase ecosystem
- ✅ Built-in CDN for fast image delivery
- ✅ Authentication & authorization
- ✅ Automatic image resizing via transformations
- ✅ Free tier: 1GB storage

**Puppeteer + Leaflet:**
- ✅ Server-side rendering (no client dependency)
- ✅ Consistent map screenshots
- ✅ Full control over map appearance
- ✅ Can render complex routes with multiple waypoints
- ✅ Open-source and free

**Alternative Options:**
1. **Static Map APIs** (not recommended):
   - ❌ Google Static Maps: $2-$7 per 1,000 requests
   - ❌ Mapbox Static Images: $0.50 per 1,000 requests
   - ❌ Limited customization

2. **Client-side rendering** (not recommended):
   - ❌ Requires client to generate and upload
   - ❌ Inconsistent results across devices
   - ❌ Slower user experience

---

## Implementation Plan

### Phase 1: Setup Supabase Storage

**Add to docker-compose.yml:**
```yaml
supabase-storage:
  container_name: mappalette-supabase-storage
  image: supabase/storage-api:v1.13.1
  restart: unless-stopped
  depends_on:
    supabase-db:
      condition: service_healthy
    supabase-rest:
      condition: service_started
  environment:
    ANON_KEY: ${SUPABASE_ANON_KEY}
    SERVICE_KEY: ${SUPABASE_SERVICE_KEY}
    POSTGREST_URL: http://supabase-rest:3000
    PGRST_JWT_SECRET: ${JWT_SECRET}
    DATABASE_URL: postgres://supabase_storage_admin:${POSTGRES_PASSWORD}@supabase-db:5432/${POSTGRES_DB}
    FILE_SIZE_LIMIT: 52428800  # 50MB
    STORAGE_BACKEND: file
    FILE_STORAGE_BACKEND_PATH: /var/lib/storage
    TENANT_ID: stub
    REGION: us-east-1
    GLOBAL_S3_BUCKET: supabase-storage
  volumes:
    - supabase-storage-data:/var/lib/storage
  networks:
    - mappalette-network
```

**Storage Buckets:**
1. `profile-pictures` - User avatars
2. `route-images` - Map screenshots of routes
3. `route-images-optimized` - Optimized versions (thumbnail, small, large)

### Phase 2: Server-Side Map Rendering

**Install Dependencies:**
```bash
npm install puppeteer leaflet @supabase/storage-js
```

**Map Renderer Service** (`backend/shared/utils/mapRenderer.js`):
- Generate HTML with Leaflet map
- Render route with waypoints
- Customize colors, markers, zoom level
- Screenshot with Puppeteer
- Return image buffer

### Phase 3: Image Upload to Supabase Storage

**Storage Service** (`backend/shared/utils/storageService.js`):
- Upload images to Supabase Storage
- Generate public URLs
- Handle permissions (public/private)
- Delete old images

### Phase 4: Integration

**Post Creation Flow:**
1. User creates route with waypoints
2. Backend generates map screenshot (Puppeteer + Leaflet)
3. Optimize image (Sharp) - create thumbnail, medium, large
4. Upload to Supabase Storage
5. Store URLs in database
6. Return post with image URLs

**Profile Picture Flow:**
1. User uploads avatar
2. Validate image (size, format)
3. Optimize (Sharp) - create thumbnail, small, medium
4. Upload to Supabase Storage
5. Store URL in database

---

## Code Structure

```
backend/
├── shared/
│   ├── utils/
│   │   ├── mapRenderer.js          # Generate map screenshots
│   │   ├── storageService.js       # Supabase Storage integration
│   │   ├── imageOptimizer.js       # ✅ Already implemented
│   │   └── queue.js                # ✅ Already implemented (for async jobs)
│   └── templates/
│       └── map-template.html       # Leaflet map HTML template
└── services/
    └── atomic/
        └── post-service/
            └── controllers/
                └── postController.js  # Updated to generate images
```

---

## Advantages of This Approach

### Server-Side Rendering:
✅ **Consistent**: Same image quality for all users
✅ **Fast**: Pre-generated images load instantly
✅ **SEO**: Images available for social sharing (Open Graph)
✅ **Offline**: Images available even when user offline
✅ **Secure**: Server controls what gets rendered

### Supabase Storage:
✅ **Cost-Effective**: Free tier: 1GB storage
✅ **Fast**: Global CDN for image delivery
✅ **Integrated**: Works with Supabase Auth
✅ **Transformations**: On-the-fly image resizing via URL params
✅ **Policies**: Row-level security for private images

### Open Source Maps:
✅ **Free**: OpenStreetMap is completely free
✅ **No API Keys**: No rate limits or quotas
✅ **Customizable**: Full control over styling
✅ **Privacy**: No tracking (unlike Google Maps)

---

## Performance Optimizations

### 1. **Async Processing**
- Generate map images in background job (Bull queue)
- User gets instant response, image generated asynchronously
- Webhook/polling to notify when image ready

### 2. **Caching**
- Cache rendered map images (same waypoints = same image)
- Use Redis to cache map HTML templates
- CDN caching via Supabase Storage

### 3. **Image Optimization**
- Sharp optimization (60-90% size reduction)
- Multiple sizes (thumbnail: 300x300, medium: 800x600, large: 1200x900)
- WebP format for modern browsers

### 4. **Lazy Rendering**
- Only render map image when post is made public
- Private posts don't need images until published

---

## Cost Comparison

### Current Approach (URLs only):
- Storage: $0 (no images stored)
- Bandwidth: $0 (no images served)
- **Problem**: No images exist!

### Static Map API Approach:
- Google Static Maps: **$2-$7 per 1,000 renders**
- Mapbox Static: **$0.50 per 1,000 renders**
- For 10,000 posts/month: **$5-$70/month**

### Recommended Approach (Puppeteer + Supabase):
- Compute: **$0** (runs on your server)
- Storage: **$0** (1GB free tier, $0.021/GB after)
- Bandwidth: **$0** (CDN included)
- **Total: $0-$2/month** for small-medium scale

---

## Alternative: Client-Side with Canvas API

If you prefer client-side generation:

**Pros:**
- No server compute needed
- User sees live preview before posting

**Cons:**
- Slower (client must render, upload)
- Inconsistent (different devices = different quality)
- Requires client-side map library
- Security risk (malicious images)

**Implementation:**
1. Frontend renders map with Leaflet/Mapbox
2. Use `html2canvas` or `leaflet-image` to screenshot
3. Client uploads to Supabase Storage
4. Backend validates and stores URL

---

## Next Steps

### Immediate (1-2 hours):
1. ✅ Add Supabase Storage to docker-compose.yml
2. ✅ Create storage buckets (profile-pictures, route-images)
3. ✅ Implement storageService.js (upload, delete, get URL)

### Short-term (3-4 hours):
4. ✅ Implement mapRenderer.js (Puppeteer + Leaflet)
5. ✅ Create map HTML template
6. ✅ Integrate with post creation flow

### Medium-term (2-3 hours):
7. ✅ Add background job for async rendering
8. ✅ Implement image caching
9. ✅ Add profile picture upload flow

### Testing (1-2 hours):
10. ✅ Test with various route complexities
11. ✅ Performance testing (render time, image size)
12. ✅ Integration testing

**Total Implementation Time: 7-11 hours**

---

## Security Considerations

### Storage Policies:
```sql
-- Public read for route images
CREATE POLICY "Public route images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'route-images');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload route images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'route-images'
  AND auth.role() = 'authenticated'
);

-- Users can only delete their own images
CREATE POLICY "Users can delete own route images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'route-images'
  AND auth.uid() = owner
);
```

### Image Validation:
- ✅ File size limits (max 10MB)
- ✅ File type validation (JPEG, PNG, WebP only)
- ✅ Dimension limits (max 4000x4000)
- ✅ Content scanning (optional: virus scanning)

---

## Monitoring & Observability

### Metrics to Track:
- Map render time (p50, p95, p99)
- Image upload time
- Storage usage
- Failed renders
- Image optimization ratio

### Alerts:
- Render time > 10 seconds
- Failed render rate > 5%
- Storage usage > 80%

---

## Migration Plan

### Existing Posts:
For posts that already exist without images:

**Option 1: Retroactive Generation**
```javascript
// Background job to generate images for existing posts
const posts = await db.post.findMany({
  where: { imageUrl: null }
});

for (const post of posts) {
  await generateMapImage(post.id, post.waypoints);
}
```

**Option 2: Lazy Generation**
- Generate image on first view
- Cache for subsequent views
- Faster migration, less server load

---

## Recommended Configuration

### Map Rendering Settings:
```javascript
{
  width: 1200,
  height: 900,
  zoom: 'auto', // Auto-fit to route bounds
  tileProvider: 'OpenStreetMap',
  routeColor: post.color || '#FF0000',
  routeWidth: 4,
  markers: {
    start: true,
    end: true,
    waypoints: true
  },
  attribution: true,
  watermark: 'MapPalette',
  format: 'png', // Convert to WebP after
  quality: 90
}
```

### Storage Configuration:
```javascript
{
  buckets: {
    routeImages: {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
    },
    profilePictures: {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
    }
  }
}
```

---

## Conclusion

**Recommended Solution:**
✅ Puppeteer + Leaflet + OpenStreetMap for map rendering
✅ Supabase Storage for image storage & CDN
✅ Sharp for image optimization (already implemented)
✅ Bull queue for async processing (already implemented)

**Benefits:**
- $0 cost for small-medium scale
- Complete control over map appearance
- Fast, consistent image generation
- Integrated with existing Supabase setup
- Open-source, no vendor lock-in

**Ready to implement?** Let me know and I'll create the complete implementation!
