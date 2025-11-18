# Supabase Auth Implementation Guide

Complete guide for understanding and implementing authentication in MapPalette V2.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [What's Implemented](#whats-implemented)
3. [What's Missing](#whats-missing)
4. [User Signup Flow](#user-signup-flow)
5. [User Login Flow](#user-login-flow)
6. [Frontend Integration](#frontend-integration)
7. [Database Triggers](#database-triggers)
8. [Testing Auth](#testing-auth)
9. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Components

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (Vue 3)                     │
│  - Supabase Client (@supabase/supabase-js)             │
│  - Handles signup, login, logout                        │
│  - Manages JWT tokens                                   │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ JWT Token
                 ▼
┌─────────────────────────────────────────────────────────┐
│                  KONG GATEWAY (Port 8000)                │
│  Routes:                                                 │
│    /auth/*    → Supabase Auth (GoTrue)                  │
│    /rest/*    → PostgREST (Database API)                │
│    /storage/* → Storage API                             │
└────────────────┬────────────────────────────────────────┘
                 │
        ┌────────┴───────┐
        │                │
        ▼                ▼
┌──────────────┐  ┌─────────────────────────┐
│  SUPABASE    │  │   BACKEND SERVICES      │
│  AUTH        │  │   (Microservices)       │
│  (GoTrue)    │  │                         │
│              │  │  - User Service         │
│  Port: 9999  │  │  - Post Service         │
│              │  │  - Feed Service, etc.   │
│  Creates:    │  │                         │
│  auth.users  │  │  Validates JWT with:    │
│              │  │  @supabase/supabase-js  │
└──────┬───────┘  └──────────┬──────────────┘
       │                     │
       │                     │
       ▼                     ▼
┌─────────────────────────────────────────┐
│         PostgreSQL Database              │
│                                          │
│  auth.users    (Supabase Auth accounts) │
│  public.users  (User profiles)          │
│  public.posts  (User content)           │
│  ...                                     │
└──────────────────────────────────────────┘
```

---

## What's Implemented

### ✅ Backend Auth Middleware

**Location**: `backend/shared/middleware/auth.js`

```javascript
// Verify JWT token from Supabase
const { verifyAuth } = require('/app/shared/middleware/auth');

router.get('/protected', verifyAuth, (req, res) => {
  // req.user contains { id, email, ...user_metadata }
  res.json({ user: req.user });
});
```

**Three middleware functions**:
1. **`verifyAuth`** - Requires valid JWT, rejects if missing/invalid
2. **`verifyOwnership(paramName)`** - Ensures user owns the resource
3. **`optionalAuth`** - Allows requests with or without token

### ✅ Supabase Stack (Docker)

```yaml
supabase-auth:    # GoTrue auth service
supabase-rest:    # PostgREST database API
supabase-kong:    # Kong API gateway
supabase-db:      # PostgreSQL 15
```

### ✅ JWT Configuration

```env
JWT_SECRET=your-secret-32-chars-min
JWT_EXPIRY=3600
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
```

### ✅ User Profile Management

**Endpoint**: `POST /api/users/create`

Creates user profile in PostgreSQL **after** Supabase Auth creates account.

---

## What's Missing

### ⚠️ 1. Frontend Auth Integration

**Status**: NOT implemented yet (Person B's responsibility)

**What's needed**:
```javascript
// frontend/src/composables/useAuth.js
import { createClient } from '@supabase/supabase-js'

export function useAuth() {
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )

  async function signUp({ email, password, username }) {
    // 1. Create auth account
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username } // Stored in user_metadata
      }
    })

    if (error) throw error

    // 2. Create profile in backend
    await createUserProfile(data.user)

    return data
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return { signUp, signIn, signOut }
}
```

### ⚠️ 2. Automatic Profile Creation

**Problem**: Two-step process can fail
1. Supabase creates `auth.users` entry ✅
2. Frontend calls backend to create `public.users` entry ❌ (can fail)

**Solution**: Database trigger (see below)

### ⚠️ 3. Email Confirmation

**Status**: Currently disabled

```env
ENABLE_EMAIL_AUTOCONFIRM=true  # Change to false in production
```

For production, configure SMTP:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### ⚠️ 4. Password Reset

**Status**: Supabase supports it, frontend needs to implement

```javascript
// Send reset email
await supabase.auth.resetPasswordForEmail(email)

// Handle reset in frontend route
await supabase.auth.updateUser({ password: newPassword })
```

---

## User Signup Flow

### Current Flow (Two-Step)

```
┌──────────────┐
│   Frontend   │
└──────┬───────┘
       │
       │ 1. POST /auth/v1/signup
       │    { email, password, metadata }
       ▼
┌──────────────┐
│  Supabase    │──► Creates auth.users entry
│  Auth        │
└──────┬───────┘
       │
       │ Returns: { user, session }
       │
       ▼
┌──────────────┐
│   Frontend   │
└──────┬───────┘
       │
       │ 2. POST /api/users/create
       │    { userId, email, username, ... }
       ▼
┌──────────────┐
│   Backend    │──► Creates public.users entry
│ User Service │
└──────────────┘
```

**Problem**: If step 2 fails, user has auth account but no profile!

### Improved Flow (Database Trigger)

```
┌──────────────┐
│   Frontend   │
└──────┬───────┘
       │
       │ POST /auth/v1/signup
       │ { email, password, metadata }
       ▼
┌──────────────┐
│  Supabase    │──► 1. Creates auth.users entry
│  Auth        │    2. Trigger auto-creates public.users entry ✅
└──────────────┘
```

**Benefit**: Atomic operation, no orphaned accounts!

---

## User Login Flow

### Standard Login

```
┌──────────────┐
│   Frontend   │
└──────┬───────┘
       │
       │ POST /auth/v1/token?grant_type=password
       │ { email, password }
       ▼
┌──────────────┐
│  Supabase    │──► Verifies credentials
│  Auth        │    Returns JWT token
└──────┬───────┘
       │
       │ { access_token, refresh_token, user }
       ▼
┌──────────────┐
│   Frontend   │──► Stores token in localStorage
│              │    Sets Authorization header for API calls
└──────────────┘
```

### Token Verification (Backend)

```
┌──────────────┐
│   Frontend   │
└──────┬───────┘
       │
       │ GET /api/users/me
       │ Authorization: Bearer eyJ...
       ▼
┌──────────────┐
│   Backend    │──► Middleware verifies JWT
│ (verifyAuth) │    Decodes user info
└──────┬───────┘
       │
       │ req.user = { id, email, ...metadata }
       ▼
┌──────────────┐
│  Controller  │──► Processes request with user context
└──────────────┘
```

---

## Frontend Integration

### Install Dependencies

```bash
cd frontend
npm install @supabase/supabase-js
```

### Create Supabase Client

```javascript
// frontend/src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'http://localhost:8000',
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### Create Auth Composable

```javascript
// frontend/src/composables/useAuth.js
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

const user = ref(null)
const session = ref(null)

export function useAuth() {
  const isAuthenticated = computed(() => !!session.value)

  // Initialize - check for existing session
  async function initialize() {
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    user.value = data.session?.user ?? null

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession
      user.value = newSession?.user ?? null
    })
  }

  // Sign up new user
  async function signUp({ email, password, username, birthday, gender }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          birthday,
          gender
        }
      }
    })

    if (error) throw error

    // If auto-confirm is disabled, tell user to check email
    if (!data.session) {
      return { requiresConfirmation: true }
    }

    return data
  }

  // Sign in existing user
  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return data
  }

  // Sign out
  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  // Get access token for API calls
  function getAccessToken() {
    return session.value?.access_token
  }

  // Request password reset
  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) throw error
  }

  // Update password
  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    if (error) throw error
  }

  return {
    user,
    session,
    isAuthenticated,
    initialize,
    signUp,
    signIn,
    signOut,
    getAccessToken,
    resetPassword,
    updatePassword
  }
}
```

### API Client with Auth

```javascript
// frontend/src/api/client.js
import { useAuth } from '@/composables/useAuth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export async function apiRequest(endpoint, options = {}) {
  const { getAccessToken } = useAuth()
  const token = getAccessToken()

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'API request failed')
  }

  return response.json()
}

// Usage
export async function getUserProfile(userId) {
  return apiRequest(`/api/users/${userId}`)
}

export async function createPost(postData) {
  return apiRequest('/api/posts', {
    method: 'POST',
    body: JSON.stringify(postData)
  })
}
```

### Protected Routes

```javascript
// frontend/src/router/index.js
import { useAuth } from '@/composables/useAuth'

const router = createRouter({
  routes: [
    {
      path: '/profile',
      component: ProfileView,
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const { isAuthenticated, initialize } = useAuth()

  // Initialize auth on first navigation
  if (!isAuthenticated.value) {
    await initialize()
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    next('/login')
  } else {
    next()
  }
})
```

---

## Database Triggers

### Setup Automatic Profile Creation

**File**: `backend/shared/migrations/supabase-auth-setup.sql`

This SQL script creates triggers that automatically create user profiles when Supabase Auth creates accounts.

**Run the migration**:

```bash
# After starting Docker containers
docker compose exec supabase-db psql -U postgres -d postgres < backend/shared/migrations/supabase-auth-setup.sql
```

**What it does**:
1. Creates `handle_new_user()` function
2. Sets up trigger on `auth.users` INSERT/UPDATE
3. Automatically creates/updates `public.users` entry
4. Uses metadata from signup (username, birthday, etc.)

**Benefits**:
- ✅ Atomic operation (no partial failures)
- ✅ No manual backend API call needed
- ✅ Handles user updates automatically
- ✅ Graceful conflict handling

**Verification**:

```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Test by creating a user via Supabase Auth, then:
SELECT * FROM public.users WHERE email = 'test@example.com';
```

---

## Testing Auth

### 1. Test Signup via API

```bash
# Create account
curl -X POST http://localhost:8000/auth/v1/signup \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "data": {
      "username": "testuser",
      "birthday": "1990-01-01"
    }
  }'
```

### 2. Test Login

```bash
curl -X POST 'http://localhost:8000/auth/v1/token?grant_type=password' \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Returns: { access_token, refresh_token, user }
```

### 3. Test Protected Endpoint

```bash
# Get user profile (requires auth)
curl http://localhost:5000/api/users/123 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Verify Database

```bash
# Check auth.users
docker compose exec supabase-db psql -U postgres -d postgres -c \
  "SELECT id, email, created_at FROM auth.users;"

# Check public.users (should auto-create via trigger)
docker compose exec supabase-db psql -U postgres -d postgres -c \
  "SELECT id, email, username FROM public.users;"
```

---

## Troubleshooting

### Issue: "Invalid or expired token"

**Cause**: JWT token is invalid or expired

**Solutions**:
1. Check JWT_SECRET matches in all services
2. Token expired - refresh token or re-login
3. Check token format: `Authorization: Bearer <token>`

### Issue: "User not found"

**Cause**: Auth account exists but no profile in public.users

**Solutions**:
1. Set up database trigger (see above)
2. Manually create profile: `POST /api/users/create`
3. Check if trigger is working:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE '%auth_user%';
   ```

### Issue: "CORS error"

**Cause**: Frontend domain not allowed

**Solution**: Update CORS settings
```env
# In .env
ADDITIONAL_REDIRECT_URLS=http://localhost:3000/*,http://localhost:5173/*
```

### Issue: Email confirmation required

**Development**: Disable email confirmation
```env
ENABLE_EMAIL_AUTOCONFIRM=true
```

**Production**: Configure SMTP and enable email
```env
ENABLE_EMAIL_AUTOCONFIRM=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Issue: "Failed to fetch user"

**Causes**:
1. Supabase services not running
2. Wrong SUPABASE_PUBLIC_URL
3. Kong gateway misconfiguration

**Solutions**:
```bash
# Check services
docker compose ps

# Check logs
docker compose logs supabase-auth
docker compose logs supabase-kong

# Verify URLs
curl http://localhost:8000/auth/v1/health
```

---

## Summary

### ✅ Backend is Ready
- JWT verification middleware
- Protected endpoints
- User profile management

### ⚠️ Frontend Needs
- Install @supabase/supabase-js
- Implement auth composables
- Create signup/login pages
- Add Authorization headers to API calls

### 🔧 Recommended Setup
- Run database trigger migration
- Configure SMTP for production
- Set up proper JWT secrets
- Test auth flow end-to-end

---

**Next Steps**:
1. Run database trigger migration
2. Implement frontend auth (Person B)
3. Test signup/login flow
4. Configure email for production
