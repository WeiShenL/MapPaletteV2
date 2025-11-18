# MapPalette V2 - Frontend Documentation

Welcome to MapPalette V2 frontend! This guide will help you set up, run, and deploy the application.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development](#development)
- [Production Build](#production-build)
- [Docker Deployment](#docker-deployment)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Troubleshooting](#troubleshooting)

---

## Overview

MapPalette V2 is a social platform for sharing travel routes, discovering new places, and connecting with fellow explorers. Built with Vue 3, it features real-time interactions, infinite scroll, and beautiful map visualizations.

**Key Features**:
- 🔐 Supabase authentication with JWT
- 🚀 TanStack Query for data caching and synchronization
- 🗺️ Google Maps integration for route visualization
- 📱 Fully responsive design (mobile-first)
- ♾️ Infinite scroll with lazy loading
- 🎨 Bootstrap 5 UI components
- ⚡ Vite for fast development and optimized builds

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Vue** | 3.4+ | Progressive JavaScript framework |
| **Vite** | 5.0+ | Build tool and dev server |
| **Vue Router** | 4.x | Client-side routing |
| **TanStack Query** | 5.91+ | Data fetching and caching |
| **Supabase** | 2.83+ | Authentication and backend |
| **Axios** | 1.x | HTTP client |
| **Bootstrap** | 5.3+ | UI framework |
| **Google Maps API** | Latest | Map visualization |
| **html2canvas** | Latest | Map image capture |

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher (LTS recommended)
- **npm**: v9.0.0 or higher (comes with Node.js)
- **Git**: Latest version
- **Google Maps API Key**: Get from [Google Cloud Console](https://console.cloud.google.com/)
- **Supabase Account**: Sign up at [supabase.com](https://supabase.com)

### Check Your Environment

```bash
node --version  # Should be v18.x or higher
npm --version   # Should be v9.x or higher
git --version   # Any recent version
```

---

## Installation

### 1. Clone the Repository

```bash
# Clone the repo
git clone https://github.com/your-org/MapPaletteV2.git

# Navigate to frontend directory
cd MapPaletteV2/frontend
```

### 2. Install Dependencies

```bash
# Install all npm packages
npm install
```

This will install all dependencies listed in `package.json`, including:
- Vue 3 and Vue Router
- TanStack Query (Vue Query)
- Supabase client
- Axios
- Bootstrap
- And more...

---

## Development

### 1. Set Up Environment Variables

Create a `.env.development.local` file in the `frontend/` directory:

```bash
cp .env.development .env.development.local
```

Edit `.env.development.local` and fill in your values:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# API Endpoints (use localhost for development)
VITE_API_URL=http://localhost:3001
VITE_USER_SERVICE_URL=http://localhost:3001/users
VITE_FEED_SERVICE_URL=http://localhost:3002/feed
VITE_POST_SERVICE_URL=http://localhost:3002/posts
VITE_INTERACTION_SERVICE_URL=http://localhost:3003/interactions
VITE_FOLLOW_SERVICE_URL=http://localhost:3004/follow
VITE_PROFILE_SERVICE_URL=http://localhost:3005/profile
VITE_SOCIAL_INTERACTION_SERVICE_URL=http://localhost:3006/social
VITE_EXPLORE_ROUTES_SERVICE_URL=http://localhost:3007/explore
VITE_LEADERBOARD_SERVICE_URL=http://localhost:3008/leaderboard
VITE_USER_DISCOVERY_SERVICE_URL=http://localhost:3009/discovery

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here

# Application
VITE_APP_NAME=MapPalette
VITE_APP_URL=http://localhost:3000
VITE_APP_ENV=development

# Features
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_REPORTING=true
VITE_ENABLE_DEBUG=true
```

### 2. Start Development Server

```bash
npm run dev
```

The application will start at `http://localhost:3000` (or next available port).

**Development Features**:
- ⚡ Hot Module Replacement (HMR) - instant updates
- 🔍 Source maps for debugging
- 📝 Console logs enabled
- 🚨 Detailed error messages

### 3. Backend Services

Ensure all backend microservices are running:

```bash
# In separate terminals, navigate to backend services and start them
cd ../backend/user-service && npm start
cd ../backend/feed-service && npm start
cd ../backend/post-service && npm start
# ... etc for all services
```

Or use a process manager like PM2 or Docker Compose to run all services.

---

## Production Build

### 1. Set Up Production Environment

Create a `.env.production.local` file:

```bash
cp .env.production .env.production.local
```

Edit with your production values:

```env
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

VITE_API_URL=https://api.mappalette.com
VITE_USER_SERVICE_URL=https://api.mappalette.com/users
# ... all other production URLs

VITE_GOOGLE_MAPS_API_KEY=your-production-google-maps-key

VITE_APP_URL=https://mappalette.com
VITE_APP_ENV=production

VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
VITE_ENABLE_DEBUG=false
```

### 2. Build for Production

```bash
npm run build
```

This will:
- ✅ Bundle and minify JavaScript
- ✅ Extract and minify CSS
- ✅ Optimize images
- ✅ Remove console.log statements
- ✅ Split code into vendor chunks
- ✅ Generate source maps (optional)

**Output**: `dist/` directory with optimized static files.

### 3. Preview Production Build Locally

```bash
npm run preview
```

This serves the production build at `http://localhost:4173` for testing.

### 4. Deploy to Production

#### Option A: Static Hosting (Vercel, Netlify, etc.)

```bash
# Build the app
npm run build

# Deploy the dist/ folder to your hosting provider
# For Vercel:
vercel --prod

# For Netlify:
netlify deploy --prod --dir=dist
```

#### Option B: Your Own Server (Nginx)

```bash
# Build the app
npm run build

# Copy dist/ to your server
scp -r dist/* user@your-server:/var/www/mappalette/

# Nginx configuration is already provided in nginx.conf
```

---

## Docker Deployment

### 1. Build Docker Image

```bash
# From frontend directory
docker build -t mappalette-frontend:latest .
```

The `Dockerfile` uses multi-stage build:
- **Stage 1 (builder)**: Installs dependencies and builds app
- **Stage 2 (production)**: Serves static files with Nginx

### 2. Run Docker Container

```bash
docker run -d \
  -p 80:80 \
  --name mappalette-frontend \
  mappalette-frontend:latest
```

The app will be available at `http://localhost`.

### 3. Docker Compose (Recommended)

If you have a `docker-compose.yml` in the root:

```bash
# From project root
docker-compose up -d
```

This will start the frontend and all backend services together.

### 4. Stop and Remove Container

```bash
docker stop mappalette-frontend
docker rm mappalette-frontend
```

---

## Environment Variables

All environment variables are prefixed with `VITE_` (required by Vite).

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key | `AIza...` |

### API Service URLs

All backend service URLs can be configured separately:

- `VITE_API_URL` - Main API gateway
- `VITE_USER_SERVICE_URL` - User management
- `VITE_FEED_SERVICE_URL` - User feed
- `VITE_POST_SERVICE_URL` - Post management
- `VITE_INTERACTION_SERVICE_URL` - Likes/comments
- `VITE_FOLLOW_SERVICE_URL` - Follow/unfollow
- `VITE_PROFILE_SERVICE_URL` - User profiles
- `VITE_SOCIAL_INTERACTION_SERVICE_URL` - Social features
- `VITE_EXPLORE_ROUTES_SERVICE_URL` - Route exploration
- `VITE_LEADERBOARD_SERVICE_URL` - Leaderboards
- `VITE_USER_DISCOVERY_SERVICE_URL` - User discovery

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_APP_NAME` | MapPalette | Application name |
| `VITE_APP_URL` | - | Full app URL |
| `VITE_APP_ENV` | development | Environment (development/production) |
| `VITE_ENABLE_ANALYTICS` | false | Enable analytics tracking |
| `VITE_ENABLE_ERROR_REPORTING` | true | Enable error reporting |
| `VITE_ENABLE_DEBUG` | true (dev), false (prod) | Enable debug mode |

---

## Project Structure

```
frontend/
├── public/              # Static assets
│   ├── favicon.svg
│   ├── sitemap.xml      # SEO sitemap
│   └── resources/       # Images and other resources
├── src/
│   ├── assets/          # Vue assets (processed by Vite)
│   ├── components/      # Vue components
│   │   ├── common/      # Reusable components
│   │   │   ├── GlobalErrorHandler.vue
│   │   │   ├── InfiniteScroll.vue
│   │   │   ├── LazyImage.vue
│   │   │   ├── LoadingSpinner.vue
│   │   │   └── PostCard.vue
│   │   └── ...          # Feature-specific components
│   ├── composables/     # Vue composition functions
│   │   ├── useAuth.js   # Authentication logic
│   │   ├── useUser.js   # User operations
│   │   ├── useQueries.js # TanStack Query hooks
│   │   ├── usePostOperations.js
│   │   ├── useFollow.js
│   │   └── useMap.js
│   ├── config/          # Configuration files
│   │   └── firebase.js  # Backward compatibility stub
│   ├── lib/             # Library configurations
│   │   ├── supabase.js  # Supabase client
│   │   └── axios.js     # Axios instance with interceptors
│   ├── router/          # Vue Router configuration
│   │   └── index.js     # Routes and navigation guards
│   ├── services/        # API service modules
│   │   ├── feedService.js
│   │   ├── followService.js
│   │   ├── interactionService.js
│   │   ├── profileService.js
│   │   ├── routesService.js
│   │   ├── socialInteractionService.js
│   │   └── userDiscoveryService.js
│   ├── views/           # Page components
│   │   ├── LoginView.vue
│   │   ├── SignupView.vue
│   │   ├── FeedView.vue
│   │   ├── ProfileView.vue
│   │   ├── ExploreView.vue
│   │   ├── LeaderboardView.vue
│   │   ├── AddMapsView.vue
│   │   ├── RoutesView.vue
│   │   └── SettingsView.vue
│   ├── App.vue          # Root component
│   └── main.js          # Application entry point
├── .env.development     # Development environment template
├── .env.production      # Production environment template
├── .gitignore
├── Dockerfile           # Docker build configuration
├── nginx.conf           # Nginx server configuration
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
├── README.md            # This file
├── TESTING.md           # Testing guide
└── COMPONENTS.md        # Component documentation
```

---

## Available Scripts

### Development

```bash
npm run dev              # Start development server (http://localhost:3000)
npm run dev -- --host    # Expose to network (accessible on LAN)
```

### Production

```bash
npm run build            # Build for production (output: dist/)
npm run preview          # Preview production build locally
```

### Linting and Formatting (if configured)

```bash
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
```

### Docker

```bash
docker build -t mappalette-frontend .    # Build Docker image
docker run -p 80:80 mappalette-frontend  # Run container
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Option A: Kill the process using port 3000
npx kill-port 3000

# Option B: Use a different port
npm run dev -- --port 3001
```

#### 2. Module Not Found Errors

**Error**: `Cannot find module '@/components/...'`

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 3. Environment Variables Not Loading

**Error**: `import.meta.env.VITE_API_URL is undefined`

**Solution**:
- Ensure variable is prefixed with `VITE_`
- Restart dev server after changing `.env` files
- Check file is named correctly (`.env.development.local`)

#### 4. Google Maps Not Loading

**Error**: Google Maps shows gray screen or "For development purposes only"

**Solution**:
- Verify `VITE_GOOGLE_MAPS_API_KEY` is set correctly
- Check API key has Maps JavaScript API enabled in Google Cloud Console
- Check billing is enabled for production use
- Verify domain restrictions (if set) include your domain

#### 5. Supabase Authentication Errors

**Error**: `Invalid JWT` or `Session expired`

**Solution**:
```javascript
// Check Supabase configuration in src/lib/supabase.js
// Ensure URL and anon key match your Supabase project
```

#### 6. Build Errors

**Error**: `Rollup failed to resolve import`

**Solution**:
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Rebuild
npm run build
```

#### 7. Infinite Scroll Not Working

**Issue**: Posts don't load on scroll

**Solution**:
- Check browser console for errors
- Verify backend pagination API is working
- Check TanStack Query devtools (if installed) for query status

---

## Performance Optimization

### Production Checklist

- [x] Code splitting enabled (vendor chunks separated)
- [x] Minification with Terser (console.log removed)
- [x] CSS code splitting enabled
- [x] Images lazy loaded with `LazyImage` component
- [x] Infinite scroll to reduce initial load
- [x] Gzip compression enabled in Nginx
- [x] Browser caching configured
- [x] Source maps disabled in production (optional)

### Lighthouse Score Target

Run Lighthouse audit to verify performance:

```bash
# Open Chrome DevTools → Lighthouse → Analyze page load
```

**Target Scores**:
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 95+

---

## Migration from Firebase

This project has been migrated from Firebase to Supabase. A backward compatibility stub exists at `src/config/firebase.js` for gradual migration.

**Components still using Firebase stub**:
- `CreatePostView.vue`
- `RoutesView.vue`
- `RouteModals.vue`

These will be fully migrated in future updates.

---

## Additional Documentation

- **[TESTING.md](./TESTING.md)** - Comprehensive testing guide
- **[COMPONENTS.md](./COMPONENTS.md)** - Component API documentation
- **Backend API Docs** - See `../backend/README.md`

---

## Support

For issues, questions, or contributions:
- **Issues**: [GitHub Issues](https://github.com/your-org/MapPaletteV2/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/MapPaletteV2/discussions)
- **Email**: support@mappalette.com

---

## License

[MIT License](../LICENSE) - See LICENSE file for details

---

**Happy coding! 🚀**
