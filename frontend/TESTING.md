# MapPalette V2 - Testing Guide

This document outlines the testing procedures for MapPalette V2 frontend application.

## Table of Contents

- [User Flow Testing](#user-flow-testing)
- [Responsive Testing](#responsive-testing)
- [Feature Testing Checklist](#feature-testing-checklist)
- [Performance Testing](#performance-testing)
- [Browser Compatibility](#browser-compatibility)

---

## User Flow Testing

### 1. Complete User Journey: Signup → Login → Post → Like → Logout

#### Step 1: Signup Flow
- **URL**: Navigate to `/signup`
- **Actions**:
  1. Enter username (min 3 characters)
  2. Enter valid email address
  3. Enter password (min 6 characters)
  4. Enter matching password confirmation
  5. Click "Sign Up" button
- **Expected Results**:
  - Form validation shows errors for invalid inputs
  - Successful signup redirects to `/feed`
  - Toast notification: "Account created successfully!"
  - User is automatically logged in
- **Error Cases**:
  - Duplicate email shows: "Email already exists"
  - Weak password shows validation error
  - Network errors show toast notification

#### Step 2: Logout Flow
- **Actions**:
  1. Click user profile dropdown in navbar
  2. Click "Logout" option
- **Expected Results**:
  - Redirects to `/login`
  - Session cleared from localStorage
  - Toast notification: "Logged out successfully"

#### Step 3: Login Flow
- **URL**: Navigate to `/login`
- **Actions**:
  1. Enter registered email
  2. Enter password
  3. Click "Login" button
- **Expected Results**:
  - Form validation for empty fields
  - Successful login redirects to `/feed`
  - Toast notification: "Welcome back!"
  - User session persisted
- **Error Cases**:
  - Invalid credentials show: "Invalid email or password"
  - Account not found shows error toast

#### Step 4: Create Post Flow
- **URL**: Navigate to `/add-maps`
- **Actions**:
  1. Enter post title
  2. Enter post caption/description
  3. Add tags (optional)
  4. Select location on map
  5. Upload image (optional)
  6. Click "Create Post" button
- **Expected Results**:
  - Map initializes with default center (Singapore)
  - Image preview shows after upload
  - Successful post redirects to `/feed`
  - Toast notification: "Post created successfully!"
  - New post appears at top of feed
- **Error Cases**:
  - Empty title/caption shows validation error
  - Image upload failure shows error message
  - Network error shows toast notification

#### Step 5: View Feed and Interact
- **URL**: `/feed`
- **Actions**:
  1. Scroll through feed posts
  2. Click like button on a post
  3. Click comment button
  4. Add a comment
  5. Click share button
- **Expected Results**:
  - Posts load with infinite scroll
  - Like button toggles (filled heart when liked)
  - Like count increments/decrements
  - Comment modal opens
  - Comment appears in comments list
  - Share copies link to clipboard
  - Toast notification: "Link copied to clipboard!"
- **Performance**:
  - Infinite scroll loads new posts smoothly
  - No UI freezing during interactions
  - Optimistic UI updates for likes

#### Step 6: Profile and Follow Flow
- **URL**: Navigate to another user's profile
- **Actions**:
  1. Click on a post author's username
  2. View their profile page
  3. Click "Follow" button
  4. View followers/following counts
  5. Navigate to own profile
- **Expected Results**:
  - Profile loads with user info and posts
  - Follow button toggles to "Unfollow"
  - Follower count increments
  - Own profile shows "Edit Profile" button
  - Posts tab shows user's posts with infinite scroll

---

## Responsive Testing

### Mobile Testing (iOS)

**Devices to Test**:
- iPhone 14 Pro (393x852)
- iPhone 13 (390x844)
- iPhone SE (375x667)

**Safari Browser Testing**:
1. **Navigation**:
   - Bottom navbar visible and accessible
   - All nav items clickable
   - Active route highlighted
2. **Feed**:
   - Post cards render correctly (full width)
   - Images scale properly
   - Infinite scroll works with touch gestures
3. **Forms**:
   - Input fields zoom properly (no unwanted zoom)
   - Keyboard pushes content up without breaking layout
   - Submit buttons accessible above keyboard
4. **Maps**:
   - Google Maps renders and is interactive
   - Touch gestures work (pinch-to-zoom, pan)
   - Location markers visible
5. **Modals**:
   - Comment modal covers full screen
   - Close button accessible
   - Scrollable content

### Mobile Testing (Android)

**Devices to Test**:
- Samsung Galaxy S23 (360x800)
- Google Pixel 7 (412x915)
- Samsung Galaxy A52 (412x915)

**Chrome Browser Testing**:
1. **Navigation**: Same as iOS
2. **Feed**: Same as iOS
3. **Forms**:
   - Android keyboard behavior
   - Autofill compatibility
4. **Maps**: Same as iOS
5. **Performance**:
   - Smooth scrolling
   - No janky animations

### Tablet Testing

**Devices to Test**:
- iPad Pro 12.9" (1024x1366)
- iPad Air (820x1180)

**Safari/Chrome Testing**:
1. **Layout**:
   - Two-column layout for wider screens (if applicable)
   - Post cards use optimal width
   - Navbar adapts to tablet size
2. **Touch Targets**:
   - All buttons min 44x44px
   - Easy to tap without zoom

### Desktop Testing

**Resolutions to Test**:
- 1920x1080 (Full HD)
- 1366x768 (Common laptop)
- 2560x1440 (2K)

**Browsers to Test**:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Desktop-Specific Tests**:
1. **Layout**:
   - Centered content container
   - Optimal reading width (max 1200px)
   - Sidebar navigation (if applicable)
2. **Hover States**:
   - Buttons show hover effects
   - Cards have subtle shadow on hover
3. **Keyboard Navigation**:
   - Tab through all interactive elements
   - Focus indicators visible
   - Enter key submits forms
4. **Maps**:
   - Mouse wheel zoom works
   - Click-and-drag panning

---

## Feature Testing Checklist

### Authentication Features
- [ ] Signup with email/password
- [ ] Login with email/password
- [ ] Logout functionality
- [ ] Session persistence (refresh page while logged in)
- [ ] Auto-logout on token expiration
- [ ] Password reset flow (if implemented)
- [ ] Protected routes redirect to login
- [ ] Login redirects to intended page after auth

### Post Management
- [ ] Create new post with title, caption, image
- [ ] View post details
- [ ] Edit own post
- [ ] Delete own post with confirmation
- [ ] Upload and preview image
- [ ] Add tags to posts
- [ ] Select location on map

### Social Interactions
- [ ] Like a post (toggle like/unlike)
- [ ] Like count updates in real-time
- [ ] Add comment to post
- [ ] View all comments on a post
- [ ] Comment count updates
- [ ] Share post (copy link)
- [ ] Follow/unfollow users
- [ ] Follower/following counts update

### Feed and Explore
- [ ] Personal feed loads correctly
- [ ] Infinite scroll loads more posts
- [ ] Pull-to-refresh (mobile)
- [ ] Explore page shows all posts
- [ ] Filter posts by tags/location (if implemented)
- [ ] Search functionality (if implemented)

### Profile
- [ ] View own profile
- [ ] View other users' profiles
- [ ] Edit profile (username, bio, avatar)
- [ ] Upload profile picture
- [ ] View user's posts on profile
- [ ] View followers/following lists

### Leaderboard
- [ ] Leaderboard displays top users
- [ ] Sorting by different metrics (if implemented)
- [ ] User rankings update correctly

### Routes Feature
- [ ] Create new route
- [ ] View saved routes
- [ ] Edit route
- [ ] Delete route
- [ ] Route displayed on map with polyline

### Settings
- [ ] Update account settings
- [ ] Change password
- [ ] Update notification preferences (if implemented)
- [ ] Privacy settings (if implemented)

---

## Performance Testing

### Lighthouse Audit Targets

Run Lighthouse audit in Chrome DevTools:

```bash
# In Incognito mode
1. Open Chrome DevTools (F12)
2. Navigate to "Lighthouse" tab
3. Select "Desktop" or "Mobile"
4. Click "Analyze page load"
```

**Target Scores** (Production build):
- **Performance**: 90+ (Green)
- **Accessibility**: 90+ (Green)
- **Best Practices**: 90+ (Green)
- **SEO**: 95+ (Green)

### Key Metrics to Monitor:

- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **Total Blocking Time (TBT)**: < 200ms
- **Cumulative Layout Shift (CLS)**: < 0.1

### Performance Optimization Checklist:
- [ ] Images lazy loaded
- [ ] Code splitting enabled
- [ ] Vendor bundles separated
- [ ] CSS minified
- [ ] JavaScript minified with terser
- [ ] Gzip compression enabled (Nginx)
- [ ] Browser caching configured
- [ ] No console.log in production build

---

## Browser Compatibility

### Supported Browsers:

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest, Latest-1 | ✅ Fully Supported |
| Firefox | Latest, Latest-1 | ✅ Fully Supported |
| Safari | Latest, Latest-1 | ✅ Fully Supported |
| Edge | Latest, Latest-1 | ✅ Fully Supported |
| Safari iOS | iOS 14+ | ✅ Fully Supported |
| Chrome Android | Latest | ✅ Fully Supported |
| Samsung Internet | Latest | ⚠️ Basic Support |

### Known Issues:
- **Safari < 14**: May have issues with `<dialog>` element (use polyfill if needed)
- **IE11**: Not supported (Vue 3 does not support IE11)

---

## Error Handling Testing

### Network Errors
1. **Simulate offline mode**:
   - Open DevTools → Network tab → Check "Offline"
   - Try to login, create post, like post
   - **Expected**: Toast error "Network error. Please check your connection."

2. **Simulate slow 3G**:
   - Network tab → Throttling → "Slow 3G"
   - Navigate through app
   - **Expected**: Loading spinners show, no UI freezing

### API Errors
1. **401 Unauthorized**:
   - Manually expire token or modify interceptor
   - **Expected**: Auto-logout, redirect to login

2. **500 Server Error**:
   - Mock API to return 500 status
   - **Expected**: Toast error "Something went wrong. Please try again."

### Form Validation Errors
1. **Empty fields**: Show validation message
2. **Invalid email**: Show "Please enter a valid email"
3. **Password mismatch**: Show "Passwords do not match"

---

## Accessibility Testing

### Keyboard Navigation
- [ ] All interactive elements focusable with Tab
- [ ] Focus indicators visible
- [ ] Escape key closes modals
- [ ] Enter key submits forms

### Screen Reader Testing
- [ ] Image alt text descriptive
- [ ] Form labels associated correctly
- [ ] ARIA labels for icon buttons
- [ ] Heading hierarchy logical (h1 → h2 → h3)

### Color Contrast
- [ ] Text contrast ratio ≥ 4.5:1 (WCAG AA)
- [ ] Large text ≥ 3:1
- [ ] Interactive elements distinguishable

---

## Test Execution Log

| Test Category | Date | Tester | Status | Notes |
|---------------|------|--------|--------|-------|
| User Flow Testing | YYYY-MM-DD | Name | ✅/❌ | |
| Mobile iOS | YYYY-MM-DD | Name | ✅/❌ | |
| Mobile Android | YYYY-MM-DD | Name | ✅/❌ | |
| Desktop Chrome | YYYY-MM-DD | Name | ✅/❌ | |
| Desktop Safari | YYYY-MM-DD | Name | ✅/❌ | |
| Lighthouse Audit | YYYY-MM-DD | Name | Score: XX | |
| Accessibility | YYYY-MM-DD | Name | ✅/❌ | |

---

## Reporting Issues

When reporting bugs, include:
1. **Environment**: Browser, OS, device
2. **Steps to Reproduce**: Numbered list
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happened
5. **Screenshots/Videos**: If applicable
6. **Console Errors**: Any error messages

**Example**:
```
Environment: Chrome 120, Windows 11
Steps:
1. Navigate to /feed
2. Click like on first post
3. Observe UI

Expected: Like count increments
Actual: Like count stays the same
Console: Error: Cannot read property 'id' of undefined
```

---

## Automated Testing (Future)

**Recommended Tools**:
- **Unit Tests**: Vitest
- **Component Tests**: Vue Test Utils
- **E2E Tests**: Playwright or Cypress
- **Visual Regression**: Percy or Chromatic

**Priority Test Cases**:
1. Authentication flows
2. Post creation and interaction
3. Infinite scroll pagination
4. Form validations
