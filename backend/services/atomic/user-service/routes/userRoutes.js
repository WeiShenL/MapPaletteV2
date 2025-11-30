const express = require('express');
const router = express.Router();
const multer = require('multer');
const userController = require('../controllers/userController');
const { verifyAuth, verifyOwnership } = require('/app/shared/middleware/auth');
const { validate, userIDSchema, currentUserIDSchema, usernameSchema, paginationSchema } = require('/app/shared/middleware/validator');
const { moderateLimiter, lenientLimiter, strictLimiter, createLimiter } = require('/app/shared/middleware/rateLimiter');
const { asyncHandler } = require('/app/shared/middleware/errorHandler');

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

// Public routes - Read operations (lenient rate limit)
router.get('/getallusers', lenientLimiter, validate({ query: paginationSchema }), asyncHandler(userController.getAllUsers));
router.get('/all', lenientLimiter, validate({ query: paginationSchema }), asyncHandler(userController.getAllUsers));
router.get('/getcondensed/:currentUserID', lenientLimiter, validate({ params: currentUserIDSchema }), asyncHandler(userController.getCondensedUsers));
router.get('/:userID', lenientLimiter, validate({ params: userIDSchema }), asyncHandler(userController.getUserById));
router.get('/:userID/likedPosts', lenientLimiter, validate({ params: userIDSchema, query: paginationSchema }), asyncHandler(userController.getUserLikedPosts));
router.get('/getfollowers/:userID', lenientLimiter, validate({ params: userIDSchema, query: paginationSchema }), asyncHandler(userController.getUserFollowers));
router.get('/following/:userID', lenientLimiter, validate({ params: userIDSchema, query: paginationSchema }), asyncHandler(userController.getUserFollowing));
router.get('/leaderboard/all', lenientLimiter, validate({ query: paginationSchema }), asyncHandler(userController.getUsersForLeaderboard));

// Batch operations (moderate rate limit)
router.post('/batch', moderateLimiter, asyncHandler(userController.getUsersBatch));

// Create operations (strict rate limit)
router.post('/create', createLimiter, asyncHandler(userController.createUser));

// Protected routes (requires authentication) - Moderate rate limit
router.post(
  '/upload-profile-picture/:userID',
  moderateLimiter,
  verifyAuth,
  verifyOwnership('userID'),
  validate({ params: userIDSchema }),
  upload.single('profilePicture'),
  asyncHandler(userController.uploadProfilePicture)
);

router.put(
  '/update/username/:userID',
  moderateLimiter,
  verifyAuth,
  verifyOwnership('userID'),
  validate({ params: userIDSchema, body: usernameSchema }),
  asyncHandler(userController.updateUsername)
);

router.put(
  '/update/profilePicture/:userID',
  moderateLimiter,
  verifyAuth,
  verifyOwnership('userID'),
  validate({ params: userIDSchema }),
  asyncHandler(userController.updateProfilePicture)
);

router.put(
  '/:userID/privacy',
  moderateLimiter,
  verifyAuth,
  verifyOwnership('userID'),
  validate({ params: userIDSchema }),
  asyncHandler(userController.updatePrivacySettings)
);

// Internal service routes (require service key) - Strict rate limit
router.put('/:userID/points', strictLimiter, validate({ params: userIDSchema }), asyncHandler(userController.updateUserPoints));
router.patch('/:userID/count', strictLimiter, validate({ params: userIDSchema }), asyncHandler(userController.updateUserCount));

// Admin routes (require service key for now) - Strict rate limit
router.delete('/:userID/delete', strictLimiter, validate({ params: userIDSchema }), asyncHandler(userController.deleteUser));
router.put('/assignDefaultProfilePicture', strictLimiter, asyncHandler(userController.assignDefaultProfilePicture));

module.exports = router;
