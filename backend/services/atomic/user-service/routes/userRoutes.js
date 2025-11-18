const express = require('express');
const router = express.Router();
const multer = require('multer');
const userController = require('../controllers/userController.new');
const { verifyAuth, verifyOwnership } = require('/app/shared/middleware/auth');
const { validate } = require('/app/shared/middleware/validation');
const { rateLimiters } = require('/app/shared/middleware/rateLimit');
const { createUserSchema, updateUserSchema } = require('/app/shared/schemas/user');

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

// Public routes
router.post('/create', rateLimiters.strict, validate(createUserSchema), userController.createUser);
router.get('/getallusers', userController.getAllUsers);
router.get('/all', userController.getAllUsers);
router.get('/getcondensed/:currentUserID', userController.getCondensedUsers);
router.get('/:userID', userController.getUserById);
router.get('/:userID/likedPosts', userController.getUserLikedPosts);
router.get('/getfollowers/:userID', userController.getUserFollowers);
router.get('/following/:userID', userController.getUserFollowing);
router.post('/batch', rateLimiters.moderate, userController.getUsersBatch);
router.get('/leaderboard/all', userController.getUsersForLeaderboard);

// Protected routes (requires authentication)
router.post(
  '/upload-profile-picture/:userID',
  verifyAuth,
  verifyOwnership('userID'),
  upload.single('profilePicture'),
  userController.uploadProfilePicture
);

router.put(
  '/update/username/:userID',
  verifyAuth,
  verifyOwnership('userID'),
  userController.updateUsername
);

router.put(
  '/update/profilePicture/:userID',
  verifyAuth,
  verifyOwnership('userID'),
  userController.updateProfilePicture
);

router.put(
  '/:userID/privacy',
  verifyAuth,
  verifyOwnership('userID'),
  userController.updatePrivacySettings
);

// Internal service routes (require service key)
router.put('/:userID/points', userController.updateUserPoints);
router.patch('/:userID/count', userController.updateUserCount);

// Admin routes (require service key for now)
router.delete('/:userID/delete', userController.deleteUser);
router.put('/assignDefaultProfilePicture', userController.assignDefaultProfilePicture);

module.exports = router;
