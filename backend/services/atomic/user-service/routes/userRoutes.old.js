const express = require('express');
const router = express.Router();
const multer = require('multer');
const userController = require('../controllers/userController');
const { verifyToken, verifyOwnership, verifyAdmin } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
    }
  }
});

// Create a new user
router.post('/create', userController.createUser);

// Upload profile picture
router.post('/upload-profile-picture/:userID', upload.single('profilePicture'), userController.uploadProfilePicture);

// Get all users (must be before /:userID route)
router.get('/getallusers', userController.getAllUsers);
router.get('/all', userController.getAllUsers);

// Get condensed user data with following status
router.get('/getcondensed/:currentUserID', userController.getCondensedUsers);

// Get user's followers
router.get('/getfollowers/:userID', userController.getUserFollowers);

// Get users that current user is following
router.get('/following/:userID', userController.getUserFollowing);

// Get user by ID (must be after specific routes)
router.get('/:userID', userController.getUserById);

// Get user's liked posts
router.get('/:userID/likedPosts', userController.getUserLikedPosts);

// Update username (requires authentication and ownership)
router.put('/update/username/:userID', verifyToken, verifyOwnership, userController.updateUsername);

// Update profile picture (requires authentication and ownership)
router.put('/update/profilePicture/:userID', verifyToken, verifyOwnership, userController.updateProfilePicture);

// Update privacy settings (requires authentication and ownership)
router.put('/:userID/privacy', verifyToken, verifyOwnership, userController.updatePrivacySettings);

// Delete user (Admin only)
router.delete('/:userID/delete', verifyToken, verifyAdmin, userController.deleteUser);

// Assign default profile pictures (Admin only)
router.put('/assignDefaultProfilePicture', verifyToken, verifyAdmin, userController.assignDefaultProfilePicture);


// Points management
router.put('/:userID/points', userController.updateUserPoints);

// Count management (followers, following, etc.)
router.patch('/:userID/count', userController.updateUserCount);

// Batch endpoints
router.post('/batch', userController.getUsersBatch);

// Leaderboard endpoint
router.get('/leaderboard', userController.getUsersForLeaderboard);

module.exports = router;