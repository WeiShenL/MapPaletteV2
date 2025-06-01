const express = require('express');
const router = express.Router();
const socialInteractionController = require('../controllers/socialInteractionController');

// Post interactions
router.post('/posts/:postId/like', socialInteractionController.likePost);
router.delete('/posts/:postId/unlike', socialInteractionController.unlikePost);
router.post('/posts/:postId/share', socialInteractionController.sharePost);
router.post('/posts/:postId/comment', socialInteractionController.addComment);
router.delete('/comments/:commentId', socialInteractionController.deleteComment);

// Get all interactions for a post
router.get('/posts/:postId/interactions', socialInteractionController.getPostInteractions);

// Follow interactions
router.post('/users/:targetUserId/follow', socialInteractionController.followUser);
router.delete('/users/:targetUserId/unfollow', socialInteractionController.unfollowUser);
router.get('/users/:targetUserId/follow-status', socialInteractionController.checkFollow);
router.get('/users/:userId/followers', socialInteractionController.getFollowers);
router.get('/users/:userId/following', socialInteractionController.getFollowing);
router.get('/users/:userId/suggested', socialInteractionController.getSuggestedUsers);

module.exports = router;