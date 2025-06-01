// not in use

const express = require('express');
const router = express.Router();
const interactionController = require('../controllers/interactionController');

// Like/Unlike endpoints
router.post('/like/:entityType/:entityId', interactionController.likeEntity);
router.delete('/unlike/:entityType/:entityId', interactionController.unlikeEntity);

// Share endpoints
router.post('/share/:entityType/:entityId', interactionController.shareEntity);

// Comment endpoints
router.post('/comment/:entityType/:entityId', interactionController.addComment);
router.get('/comment/:commentId', interactionController.getComment);
router.delete('/comment/:commentId', interactionController.deleteComment);

// Get interactions for an entity
router.get('/likes/:entityType/:entityId', interactionController.getLikes);
router.get('/comments/:entityType/:entityId', interactionController.getComments);
router.get('/shares/:entityType/:entityId', interactionController.getShares);

// Check user interaction status
router.get('/check/:entityType/:entityId/:userId', interactionController.checkUserInteraction);

module.exports = router;