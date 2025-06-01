const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');

// Post CRUD operations
router.post('/create/:userID', postController.createPost);
router.get('/posts', postController.getPost);
router.put('/posts', postController.updatePost);
router.delete('/posts', postController.deletePost);

// Post retrieval operations
router.get('/allposts', postController.getAllPosts);
router.get('/users/:userID/posts', postController.getUserPosts);

// Comment operations
router.post('/posts/:postId/comments', commentController.createComment);
router.get('/posts/:postId/comments', commentController.getComments);
router.put('/posts/:postId/comments/:commentId', commentController.updateComment);
router.delete('/posts/:postId/comments/:commentId', commentController.deleteComment);

// Update interaction counts (for Interaction Service)
router.patch('/posts/:id/count', postController.updateInteractionCount);

module.exports = router;