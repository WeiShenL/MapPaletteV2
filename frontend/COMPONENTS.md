# Component Documentation

This document provides detailed information about all reusable components and composables in MapPalette V2.

## Table of Contents

### Components
- [GlobalErrorHandler](#globalerrorhandler)
- [InfiniteScroll](#infinitescroll)
- [LazyImage](#lazyimage)
- [LoadingSpinner](#loadingspinner)
- [PostCard](#postcard)

### Composables
- [useAuth](#useauth)
- [useUser](#useuser)
- [useQueries](#usequeries)
- [usePostOperations](#usepostoperations)
- [useFollow](#usefollow)
- [useMap](#usemap)

---

## Components

### GlobalErrorHandler

Toast notification system for displaying errors, warnings, and success messages.

**Location**: `src/components/common/GlobalErrorHandler.vue`

#### Usage

```vue
<template>
  <GlobalErrorHandler />
</template>

<script>
import GlobalErrorHandler from '@/components/common/GlobalErrorHandler.vue'

export default {
  components: { GlobalErrorHandler }
}
</script>
```

Add to `App.vue` once, and use the global `window.showToast()` function anywhere:

```javascript
// Show success message
window.showToast('Post created successfully!', 'success', 2000)

// Show error message
window.showToast('Failed to load data', 'danger')

// Show warning
window.showToast('Please login to continue', 'warning')

// Show info
window.showToast('New messages available', 'info')
```

#### Global Method: `window.showToast(message, type, duration)`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `message` | String | Required | Message to display |
| `type` | String | `'info'` | Toast type: `'success'`, `'danger'`, `'warning'`, `'info'` |
| `duration` | Number | `3000` | Duration in milliseconds (0 = manual close) |

#### Features

- Auto-dismiss after duration
- Manual close button
- Smooth fade-in/fade-out transitions
- Teleports to document body (always on top)
- Color-coded by type (green, red, yellow, blue)

---

### InfiniteScroll

Container component for implementing infinite scroll pagination with TanStack Query.

**Location**: `src/components/common/InfiniteScroll.vue`

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `queryResult` | Object | Yes | - | TanStack Query infinite query result |
| `emptyMessage` | String | No | `'No items found'` | Message when no items exist |
| `endMessage` | String | No | `'You've reached the end'` | Message when all items loaded |

#### Slots

| Slot | Scope | Description |
|------|-------|-------------|
| `default` | `{ items }` | Content to render for each page |

#### Events

| Event | Payload | Description |
|-------|---------|-------------|
| None | - | Component manages loading internally |

#### Usage

```vue
<template>
  <InfiniteScroll
    :query-result="feedQuery"
    empty-message="No posts yet. Be the first to post!"
    end-message="That's all the posts!"
  >
    <template #default="{ items }">
      <PostCard
        v-for="post in items"
        :key="post.id"
        :post="post"
        @delete="handleDelete"
      />
    </template>
  </InfiniteScroll>
</template>

<script setup>
import { useInfiniteFeedQuery } from '@/composables/useQueries'
import InfiniteScroll from '@/components/common/InfiniteScroll.vue'
import PostCard from '@/components/common/PostCard.vue'
import { useAuth } from '@/composables/useAuth'

const { currentUser } = useAuth()
const feedQuery = useInfiniteFeedQuery(currentUser.value.id)

const handleDelete = (post) => {
  // Handle post deletion
}
</script>
```

#### Features

- Automatic loading on scroll (Intersection Observer)
- Loading spinner while fetching
- Empty state message
- End-of-list message
- Error handling and retry button
- Flattens paginated data automatically

---

### LazyImage

Image component with lazy loading and loading states.

**Location**: `src/components/common/LazyImage.vue`

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `src` | String | Yes | - | Image source URL |
| `alt` | String | No | `''` | Image alt text (important for accessibility) |
| `aspectRatio` | String | No | `'16/9'` | CSS aspect ratio (e.g., '4/3', '1/1', '16/9') |
| `imageClass` | String | No | `''` | Additional CSS classes for the `<img>` element |
| `placeholderColor` | String | No | `'#f0f0f0'` | Background color while loading |

#### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `load` | Event | Emitted when image loads successfully |
| `error` | Event | Emitted when image fails to load |

#### Usage

```vue
<template>
  <!-- Basic usage -->
  <LazyImage
    src="/path/to/image.jpg"
    alt="Beautiful landscape"
  />

  <!-- With aspect ratio and custom class -->
  <LazyImage
    :src="post.image"
    :alt="post.title"
    aspect-ratio="4/3"
    image-class="rounded shadow"
  />

  <!-- Avatar (1:1 ratio) -->
  <LazyImage
    :src="user.avatar"
    :alt="user.username"
    aspect-ratio="1/1"
    image-class="rounded-circle"
  />

  <!-- Listen to events -->
  <LazyImage
    :src="image"
    alt="Photo"
    @load="handleImageLoad"
    @error="handleImageError"
  />
</template>
```

#### Features

- Lazy loading with Intersection Observer
- Smooth fade-in animation on load
- Loading placeholder with custom color
- Error state with icon
- Maintains aspect ratio (no layout shift)
- Responsive (width: 100%)

---

### LoadingSpinner

Customizable loading spinner component.

**Location**: `src/components/common/LoadingSpinner.vue`

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `size` | String | No | `'md'` | Spinner size: `'sm'`, `'md'`, `'lg'` |
| `color` | String | No | `'primary'` | Bootstrap color: `'primary'`, `'secondary'`, `'success'`, etc. |
| `text` | String | No | `'Loading...'` | Loading text to display |
| `showText` | Boolean | No | `true` | Whether to show text |
| `fullScreen` | Boolean | No | `false` | Cover entire viewport |

#### Usage

```vue
<template>
  <!-- Basic spinner -->
  <LoadingSpinner />

  <!-- Small spinner without text -->
  <LoadingSpinner size="sm" :show-text="false" />

  <!-- Large spinner with custom text -->
  <LoadingSpinner
    size="lg"
    text="Loading your posts..."
    color="success"
  />

  <!-- Full-screen overlay -->
  <LoadingSpinner
    full-screen
    text="Please wait..."
  />
</template>

<script setup>
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
</script>
```

#### Sizes

- `sm`: 1rem (16px) - For inline loading
- `md`: 2rem (32px) - Default size
- `lg`: 3rem (48px) - For prominent loading states

#### Features

- Bootstrap spinner animation
- Customizable size and color
- Optional text label
- Full-screen overlay mode
- Centered alignment

---

### PostCard

Reusable card component for displaying posts with interactions.

**Location**: `src/components/common/PostCard.vue`

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `post` | Object | Yes | - | Post data object |
| `showMenu` | Boolean | No | `true` | Show edit/delete menu |

#### Post Object Structure

```typescript
interface Post {
  id: string
  title?: string
  caption?: string
  description?: string
  image?: string
  mapImage?: string
  author?: {
    id: string
    username: string
    avatar?: string
    profilePicture?: string
  }
  authorId?: string
  userId?: string
  createdAt?: string
  created_at?: string
  tags?: string[]
  region?: string
  location?: string
  likesCount?: number
  likes?: number
  commentsCount?: number
  comments?: number
  isLiked?: boolean
  liked?: boolean
}
```

#### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `edit` | `post` | Emitted when edit button clicked (owner only) |
| `delete` | `post` | Emitted after successful deletion (owner only) |
| `comment` | `post` | Emitted when comment button clicked |

#### Usage

```vue
<template>
  <div>
    <PostCard
      v-for="post in posts"
      :key="post.id"
      :post="post"
      :show-menu="true"
      @edit="handleEdit"
      @delete="handleDelete"
      @comment="handleComment"
    />
  </div>
</template>

<script setup>
import PostCard from '@/components/common/PostCard.vue'
import { ref } from 'vue'

const posts = ref([
  {
    id: '1',
    title: 'Beautiful Sunset',
    caption: 'Amazing view from the beach',
    image: '/images/sunset.jpg',
    author: {
      id: 'user1',
      username: 'john_doe',
      avatar: '/avatars/john.jpg'
    },
    createdAt: '2025-11-17T10:00:00Z',
    tags: ['sunset', 'beach', 'nature'],
    region: 'Bali, Indonesia',
    likesCount: 42,
    commentsCount: 5,
    isLiked: false
  }
])

const handleEdit = (post) => {
  console.log('Edit post:', post.id)
}

const handleDelete = (post) => {
  posts.value = posts.value.filter(p => p.id !== post.id)
}

const handleComment = (post) => {
  console.log('Comment on post:', post.id)
}
</script>
```

#### Features

- Lazy-loaded images
- Like/unlike with optimistic updates
- Comment count and button
- Share functionality (Web Share API + clipboard fallback)
- Edit/delete menu for post owners
- Relative time formatting ("2h ago", "Yesterday", etc.)
- Tag display
- Location display
- Responsive design
- Hover effects

---

## Composables

Composables are reusable Vue composition functions that encapsulate stateful logic.

### useAuth

Authentication composable using Supabase.

**Location**: `src/composables/useAuth.js`

#### Exports

##### `initAuthListener()`

Initialize authentication state listener. Call this once in `main.js` before mounting the app.

**Returns**: `Promise<void>`

```javascript
import { initAuthListener } from '@/composables/useAuth'

initAuthListener().then(() => {
  app.mount('#app')
})
```

##### `useAuth()`

Get authentication state and methods.

**Returns**: Object with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `session` | Ref<Session \| null> | Current session object |
| `currentUser` | Ref<User \| null> | Current user object with profile |
| `loading` | Ref<boolean> | Loading state |
| `error` | Ref<string \| null> | Error message |
| `isAuthenticated` | ComputedRef<boolean> | Whether user is logged in |
| `login(email, password)` | Function | Login with email/password |
| `signup(email, password, userData)` | Function | Create new account |
| `logout()` | Function | Sign out user |
| `getToken()` | Function | Get current JWT token |
| `resetPassword(email)` | Function | Send password reset email |

#### Usage

```vue
<script setup>
import { useAuth } from '@/composables/useAuth'

const {
  currentUser,
  loading,
  error,
  isAuthenticated,
  login,
  logout
} = useAuth()

const handleLogin = async () => {
  const result = await login('user@example.com', 'password123')
  if (result.success) {
    console.log('Logged in!', currentUser.value)
  } else {
    console.error('Login failed:', result.error)
  }
}

const handleLogout = async () => {
  await logout()
}
</script>

<template>
  <div v-if="isAuthenticated">
    <p>Welcome, {{ currentUser.username }}!</p>
    <button @click="handleLogout">Logout</button>
  </div>
  <div v-else>
    <button @click="handleLogin">Login</button>
  </div>
</template>
```

#### Methods

##### `login(email, password)`

**Parameters**:
- `email` (String): User's email
- `password` (String): User's password

**Returns**: `Promise<{ success: boolean, error?: string }>`

##### `signup(email, password, userData)`

**Parameters**:
- `email` (String): User's email
- `password` (String): User's password
- `userData` (Object): Additional user data (username, etc.)

**Returns**: `Promise<{ success: boolean, user?: User, error?: string }>`

##### `logout()`

**Returns**: `Promise<{ success: boolean }>`

##### `getToken()`

**Returns**: `Promise<string | null>` - JWT access token

##### `resetPassword(email)`

**Parameters**:
- `email` (String): User's email

**Returns**: `Promise<{ success: boolean, error?: string }>`

---

### useUser

User profile management composable.

**Location**: `src/composables/useUser.js`

#### Usage

```vue
<script setup>
import { useUser } from '@/composables/useUser'

const { getUserById, updateUserProfile, uploadProfilePicture } = useUser()

const loadUser = async (userId) => {
  const result = await getUserById(userId)
  if (result.success) {
    console.log('User:', result.data)
  }
}

const updateProfile = async (userId, updates) => {
  const result = await updateUserProfile(userId, updates)
  if (result.success) {
    console.log('Profile updated!')
  }
}

const uploadAvatar = async (userId, file) => {
  const result = await uploadProfilePicture(userId, file)
  if (result.success) {
    console.log('New avatar URL:', result.data.profilePicture)
  }
}
</script>
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getUserById(userId)` | `userId: string` | `Promise<{ success, data?, error? }>` | Fetch user profile by ID |
| `updateUserProfile(userId, updates)` | `userId: string, updates: Object` | `Promise<{ success, data?, error? }>` | Update user profile |
| `uploadProfilePicture(userId, file)` | `userId: string, file: File` | `Promise<{ success, data?, error? }>` | Upload profile picture |

---

### useQueries

TanStack Query hooks for data fetching and mutations.

**Location**: `src/composables/useQueries.js`

#### Infinite Queries

##### `useInfiniteFeedQuery(userId, limit = 10)`

Infinite scroll query for user's personalized feed.

**Parameters**:
- `userId` (String): Current user's ID
- `limit` (Number): Items per page (default: 10)

**Returns**: TanStack Query infinite query result

**Usage**:
```javascript
const feedQuery = useInfiniteFeedQuery(currentUser.value.id, 10)
```

##### `useInfiniteAllPostsQuery(limit = 10)`

Infinite scroll query for all posts (explore page).

##### `useInfiniteUserPostsQuery(userId, limit = 10)`

Infinite scroll query for a specific user's posts.

#### Regular Queries

| Hook | Parameters | Description |
|------|------------|-------------|
| `useFeedQuery(userId, limit, offset)` | `userId, limit, offset` | Paginated feed query |
| `useAllPostsQuery(limit, offset)` | `limit, offset` | Paginated all posts query |
| `useProfileQuery(userId)` | `userId` | User profile query |
| `useFollowersQuery(userId)` | `userId` | User's followers list |
| `useFollowingQuery(userId)` | `userId` | User's following list |
| `useIsFollowingQuery(currentUserId, targetUserId)` | `currentUserId, targetUserId` | Check if following |

#### Mutations

| Hook | Description | Parameters (mutateAsync) |
|------|-------------|--------------------------|
| `useLikeMutation()` | Like a post | `{ postId, userId }` |
| `useUnlikeMutation()` | Unlike a post | `{ postId, userId }` |
| `useFollowMutation()` | Follow a user | `{ userId, targetUserId }` |
| `useUnfollowMutation()` | Unfollow a user | `{ userId, targetUserId }` |
| `useAddCommentMutation()` | Add a comment | `{ postId, userId, content }` |

#### Usage Example

```vue
<script setup>
import { useInfiniteFeedQuery, useLikeMutation } from '@/composables/useQueries'
import { useAuth } from '@/composables/useAuth'

const { currentUser } = useAuth()
const feedQuery = useInfiniteFeedQuery(currentUser.value.id, 10)
const likeMutation = useLikeMutation()

const handleLike = async (postId) => {
  await likeMutation.mutateAsync({ postId, userId: currentUser.value.id })
}
</script>

<template>
  <div v-if="feedQuery.isLoading.value">Loading...</div>
  <div v-else-if="feedQuery.isError.value">Error loading feed</div>
  <div v-else>
    <div v-for="page in feedQuery.data.value?.pages" :key="page.nextCursor">
      <PostCard
        v-for="post in page.data"
        :key="post.id"
        :post="post"
        @like="handleLike(post.id)"
      />
    </div>
    <button
      v-if="feedQuery.hasNextPage.value"
      @click="feedQuery.fetchNextPage()"
      :disabled="feedQuery.isFetchingNextPage.value"
    >
      Load More
    </button>
  </div>
</template>
```

---

### usePostOperations

Post interaction operations (likes, comments, delete, share).

**Location**: `src/composables/usePostOperations.js`

#### Usage

```vue
<script setup>
import { usePostOperations } from '@/composables/usePostOperations'
import { useAuth } from '@/composables/useAuth'

const postOps = usePostOperations()
const { currentUser } = useAuth()

const handleLike = async (post) => {
  await postOps.toggleLike(post, currentUser.value.id)
}

const handleComment = async (postId, content) => {
  const result = await postOps.addComment(postId, currentUser.value.id, content)
  if (result.success) {
    // Refresh comments
  }
}

const handleShare = async (post) => {
  await postOps.sharePost(post)
}
</script>
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `likePost(postId, userId)` | `postId, userId` | `Promise<{ success, error? }>` | Like a post |
| `unlikePost(postId, userId)` | `postId, userId` | `Promise<{ success, error? }>` | Unlike a post |
| `toggleLike(post, userId)` | `post, userId` | `Promise<{ success, error? }>` | Toggle like/unlike |
| `addComment(postId, userId, content)` | `postId, userId, content` | `Promise<{ success, error? }>` | Add a comment |
| `getComments(postId)` | `postId` | `Promise<{ success, data?, error? }>` | Fetch comments |
| `deletePost(postId, userId)` | `postId, userId` | `Promise<{ success, error? }>` | Delete a post |
| `sharePost(post)` | `post` | `Promise<{ success, error? }>` | Share post (Web Share API) |

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `loading` | Ref<boolean> | Loading state |
| `error` | Ref<string \| null> | Error message |

---

### useFollow

Follow/unfollow operations and follower management.

**Location**: `src/composables/useFollow.js`

#### Usage

```vue
<script setup>
import { useFollow } from '@/composables/useFollow'
import { useAuth } from '@/composables/useAuth'
import { ref } from 'vue'

const { currentUser } = useAuth()
const targetUserId = ref('user123')

const {
  isFollowing,
  toggleFollow,
  getFollowers,
  getFollowing,
  getFollowCounts
} = useFollow(currentUser.value.id, targetUserId)

const handleFollowToggle = async () => {
  await toggleFollow()
}

const loadFollowers = async () => {
  const result = await getFollowers(targetUserId.value)
  console.log('Followers:', result.data)
}
</script>

<template>
  <div>
    <button @click="handleFollowToggle">
      {{ isFollowing ? 'Unfollow' : 'Follow' }}
    </button>
  </div>
</template>
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `follow()` | None | `Promise<{ success, error? }>` | Follow the target user |
| `unfollow()` | None | `Promise<{ success, error? }>` | Unfollow the target user |
| `toggleFollow()` | None | `Promise<{ success, error? }>` | Toggle follow state |
| `getFollowers(userId)` | `userId` | `Promise<{ success, data?, error? }>` | Get followers list |
| `getFollowing(userId)` | `userId` | `Promise<{ success, data?, error? }>` | Get following list |
| `getFollowCounts(userId)` | `userId` | `Promise<{ success, data?, error? }>` | Get follower/following counts |

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `loading` | Ref<boolean> | Loading state |
| `error` | Ref<string \| null> | Error message |
| `isFollowing` | ComputedRef<boolean> | Whether currently following target user |
| `isCheckingFollow` | Ref<boolean> | Loading state for follow check query |

---

### useMap

Google Maps operations and utilities.

**Location**: `src/composables/useMap.js`

#### Usage

```vue
<script setup>
import { useMap } from '@/composables/useMap'
import { ref, onMounted } from 'vue'

const mapContainer = ref(null)
const {
  map,
  markers,
  initializeMap,
  addMarker,
  addPolyline,
  clearAll,
  captureMapImage,
  geocodeAddress
} = useMap()

onMounted(async () => {
  // Initialize map
  initializeMap(mapContainer.value, {
    center: { lat: 1.3521, lng: 103.8198 },
    zoom: 12
  })

  // Add marker
  addMarker(
    { lat: 1.3521, lng: 103.8198 },
    { title: 'Singapore' }
  )

  // Add route polyline
  const path = [
    { lat: 1.3521, lng: 103.8198 },
    { lat: 1.3621, lng: 103.8298 }
  ]
  addPolyline(path, { strokeColor: '#FF0000' })
})

const handleCaptureMap = async () => {
  const imageData = await captureMapImage()
  console.log('Map image:', imageData)
}

const handleGeocoding = async () => {
  const coords = await geocodeAddress('Marina Bay Sands, Singapore')
  if (coords) {
    addMarker(coords)
  }
}
</script>

<template>
  <div>
    <div ref="mapContainer" style="width: 100%; height: 400px;"></div>
    <button @click="handleCaptureMap">Capture Map</button>
    <button @click="clearAll">Clear All</button>
  </div>
</template>
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `initializeMap(container, options)` | `HTMLElement, Object` | `google.maps.Map \| null` | Initialize Google Maps |
| `addMarker(position, options)` | `LatLng, Object` | `google.maps.Marker \| null` | Add marker to map |
| `addPolyline(path, options)` | `LatLng[], Object` | `google.maps.Polyline \| null` | Add polyline to map |
| `clearMarkers()` | None | `void` | Remove all markers |
| `clearPolylines()` | None | `void` | Remove all polylines |
| `clearAll()` | None | `void` | Remove all markers and polylines |
| `fitBounds()` | None | `void` | Fit map to show all markers |
| `getCenter()` | None | `{ lat, lng } \| null` | Get map center |
| `setCenter(position)` | `{ lat, lng }` | `void` | Set map center |
| `getZoom()` | None | `number \| null` | Get zoom level |
| `setZoom(zoom)` | `number` | `void` | Set zoom level |
| `captureMapImage()` | None | `Promise<string \| null>` | Capture map as base64 image |
| `loadGoogleMapsScript(apiKey)` | `string` | `Promise<void>` | Load Google Maps script |
| `geocodeAddress(address)` | `string` | `Promise<{ lat, lng } \| null>` | Convert address to coordinates |
| `calculateDistance(point1, point2)` | `LatLng, LatLng` | `string \| null` | Calculate distance in km |

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `map` | Ref<google.maps.Map \| null> | Google Maps instance |
| `markers` | Ref<google.maps.Marker[]> | Array of markers |
| `polylines` | Ref<google.maps.Polyline[]> | Array of polylines |
| `loading` | Ref<boolean> | Loading state |
| `error` | Ref<string \| null> | Error message |

---

## Best Practices

### Component Usage

1. **Always provide keys** when rendering lists:
   ```vue
   <PostCard v-for="post in posts" :key="post.id" :post="post" />
   ```

2. **Use lazy loading for images**:
   ```vue
   <LazyImage :src="post.image" :alt="post.title" />
   ```

3. **Handle errors gracefully**:
   ```vue
   <div v-if="query.isError.value">
     <p>{{ query.error.value.message }}</p>
     <button @click="query.refetch()">Retry</button>
   </div>
   ```

### Composable Usage

1. **Destructure only what you need**:
   ```javascript
   const { currentUser, login, logout } = useAuth()
   ```

2. **Handle async operations with try-catch**:
   ```javascript
   const handleLogin = async () => {
     try {
       const result = await login(email, password)
       if (result.success) {
         router.push('/feed')
       }
     } catch (err) {
       console.error('Login error:', err)
     }
   }
   ```

3. **Use computed for derived state**:
   ```javascript
   const isLoggedIn = computed(() => currentUser.value !== null)
   ```

---

## Additional Resources

- **Vue 3 Docs**: https://vuejs.org/guide/introduction.html
- **TanStack Query**: https://tanstack.com/query/latest/docs/vue/overview
- **Supabase Docs**: https://supabase.com/docs
- **Google Maps API**: https://developers.google.com/maps/documentation/javascript

---

**Need help?** Check the main [README.md](./README.md) or open an issue on GitHub.
