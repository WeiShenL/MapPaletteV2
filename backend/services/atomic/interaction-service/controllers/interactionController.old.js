const { db } = require('../config/firebase');
const { FieldValue } = require('firebase-admin/firestore');

// Create a like interaction
exports.likeEntity = async (req, res) => {
  const { entityType, entityId } = req.params;
  const { userId } = req.body;

  if (!entityType || !entityId || !userId) {
    return res.status(400).json({ message: 'Entity type, entity ID, and user ID are required.' });
  }

  console.log(`[LIKE] User ${userId} liking ${entityType} ${entityId}`);

  try {
    // Check if already liked
    const existingLike = await db.collection('interactions')
      .where('type', '==', 'like')
      .where('entityType', '==', entityType)
      .where('entityId', '==', entityId)
      .where('userId', '==', userId)
      .get();

    if (!existingLike.empty) {
      console.log(`[LIKE] User ${userId} already liked ${entityType} ${entityId}`);
      return res.status(400).json({ message: 'User has already liked this entity.' });
    }

    // Create like interaction
    const interactionRef = await db.collection('interactions').add({
      type: 'like',
      entityType,
      entityId,
      userId,
      createdAt: FieldValue.serverTimestamp()
    });

    console.log(`[LIKE] Successfully created like: ${interactionRef.id}`);
    return res.status(200).json({ 
      message: 'Entity liked successfully!',
      interactionId: interactionRef.id 
    });
  } catch (error) {
    console.error(`[LIKE] Error liking ${entityType} ${entityId}:`, error);
    return res.status(500).json({ message: error.message });
  }
};

// Delete a like interaction
exports.unlikeEntity = async (req, res) => {
  const { entityType, entityId } = req.params;
  const { userId } = req.body;

  if (!entityType || !entityId || !userId) {
    return res.status(400).json({ message: 'Entity type, entity ID, and user ID are required.' });
  }

  console.log(`[UNLIKE] User ${userId} unliking ${entityType} ${entityId}`);

  try {
    // Find the like interaction
    const likeQuery = await db.collection('interactions')
      .where('type', '==', 'like')
      .where('entityType', '==', entityType)
      .where('entityId', '==', entityId)
      .where('userId', '==', userId)
      .get();

    if (likeQuery.empty) {
      console.log(`[UNLIKE] User ${userId} has not liked ${entityType} ${entityId}`);
      return res.status(400).json({ message: 'User has not liked this entity yet.' });
    }

    // Delete the like interaction
    const batch = db.batch();
    likeQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    console.log(`[UNLIKE] Successfully removed like for ${entityType} ${entityId}`);
    return res.status(200).json({ message: 'Entity unliked successfully!' });
  } catch (error) {
    console.error(`[UNLIKE] Error unliking ${entityType} ${entityId}:`, error);
    return res.status(500).json({ message: error.message });
  }
};

// Create a share interaction
exports.shareEntity = async (req, res) => {
  const { entityType, entityId } = req.params;
  const { userId } = req.body;

  if (!entityType || !entityId || !userId) {
    return res.status(400).json({ message: 'Entity type, entity ID, and user ID are required.' });
  }

  console.log(`[SHARE] User ${userId} sharing ${entityType} ${entityId}`);

  try {
    // Note: We allow multiple shares by the same user
    // If prevent duplicate shares, uncomment the check below
    /*
    const existingShare = await db.collection('interactions')
      .where('type', '==', 'share')
      .where('entityType', '==', entityType)
      .where('entityId', '==', entityId)
      .where('userId', '==', userId)
      .get();

    if (!existingShare.empty) {
      return res.status(400).json({ message: 'User has already shared this entity.' });
    }
    */

    // Create share interaction
    const interactionRef = await db.collection('interactions').add({
      type: 'share',
      entityType,
      entityId,
      userId,
      createdAt: FieldValue.serverTimestamp()
    });

    console.log(`[SHARE] Successfully created share: ${interactionRef.id}`);
    return res.status(200).json({ 
      message: 'Entity shared successfully!',
      interactionId: interactionRef.id 
    });
  } catch (error) {
    console.error(`[SHARE] Error sharing ${entityType} ${entityId}:`, error);
    return res.status(500).json({ message: error.message });
  }
};

// Create a comment interaction
exports.addComment = async (req, res) => {
  const { entityType, entityId } = req.params;
  const { userId, content, username } = req.body;

  if (!entityType || !entityId || !userId || !content) {
    return res.status(400).json({ message: 'Entity type, entity ID, user ID, and content are required.' });
  }

  console.log(`[COMMENT] User ${userId} commenting on ${entityType} ${entityId}`);

  try {
    // Create comment interaction
    // note: userId/username is the commenter, whereas entityId is the poster userId.
    const commentData = {
      type: 'comment',
      entityType,
      entityId,
      userId,
      content,
      username: username || 'Unknown User',
      createdAt: FieldValue.serverTimestamp()
    };

    const interactionRef = await db.collection('interactions').add(commentData);

    console.log(`[COMMENT] Successfully created comment: ${interactionRef.id}`);
    return res.status(201).json({ 
      message: 'Comment added successfully!',
      commentId: interactionRef.id,
      comment: { id: interactionRef.id, ...commentData }
    });
  } catch (error) {
    console.error(`[COMMENT] Error adding comment to ${entityType} ${entityId}:`, error);
    return res.status(500).json({ message: error.message });
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  const { commentId } = req.params;
  const { userId } = req.body;

  if (!commentId || !userId) {
    return res.status(400).json({ message: 'Comment ID and user ID are required.' });
  }

  console.log(`[DELETE_COMMENT] User ${userId} deleting comment ${commentId}`);

  try {
    // Get the comment
    const commentDoc = await db.collection('interactions').doc(commentId).get();
    
    if (!commentDoc.exists) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    const comment = commentDoc.data();
    
    // Verify ownership
    if (comment.userId !== userId) {
      console.log(`[DELETE_COMMENT] User ${userId} unauthorized to delete comment ${commentId}`);
      return res.status(403).json({ message: 'Unauthorized to delete this comment.' });
    }

    // Delete the comment
    await db.collection('interactions').doc(commentId).delete();

    console.log(`[DELETE_COMMENT] Successfully deleted comment ${commentId}`);
    return res.status(200).json({ message: 'Comment deleted successfully!' });
  } catch (error) {
    console.error(`[DELETE_COMMENT] Error deleting comment ${commentId}:`, error);
    return res.status(500).json({ message: error.message });
  }
};

// Get a single comment (needed for composite service)
exports.getComment = async (req, res) => {
  const { commentId } = req.params;

  try {
    const commentDoc = await db.collection('interactions').doc(commentId).get();
    
    if (!commentDoc.exists) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    return res.status(200).json({
      id: commentDoc.id,
      ...commentDoc.data()
    });
  } catch (error) {
    console.error('Error fetching comment:', error);
    return res.status(500).json({ message: error.message });
  }
};

// Get all likes for an entity
exports.getLikes = async (req, res) => {
  const { entityType, entityId } = req.params;

  try {
    const likesQuery = await db.collection('interactions')
      .where('type', '==', 'like')
      .where('entityType', '==', entityType)
      .where('entityId', '==', entityId)
      .orderBy('createdAt', 'desc')
      .get();

    const likes = likesQuery.docs.map(doc => ({
      id: doc.id,
      userId: doc.data().userId,
      createdAt: doc.data().createdAt
    }));

    return res.status(200).json({
      count: likes.length,
      likes: likes
    });
  } catch (error) {
    console.error('Error fetching likes:', error);
    return res.status(500).json({ message: error.message });
  }
};

// Get all comments for an entity
exports.getComments = async (req, res) => {
  const { entityType, entityId } = req.params;

  try {
    const commentsQuery = await db.collection('interactions')
      .where('type', '==', 'comment')
      .where('entityType', '==', entityType)
      .where('entityId', '==', entityId)
      .orderBy('createdAt', 'desc')
      .get();

    const comments = commentsQuery.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        username: data.username,
        content: data.content,
        text: data.content, 
        createdAt: data.createdAt
      };
    });

    return res.status(200).json({
      count: comments.length,
      comments: comments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    
    // If it's a missing index error, provide helpful message
    if (error.code === 9) {
      return res.status(500).json({ 
        message: 'Database index not ready. Please wait for indexes to build in Firebase Console.',
        error: error.message 
      });
    }
    
    return res.status(500).json({ message: error.message });
  }
};

// Get all shares for an entity
exports.getShares = async (req, res) => {
  const { entityType, entityId } = req.params;

  try {
    const sharesQuery = await db.collection('interactions')
      .where('type', '==', 'share')
      .where('entityType', '==', entityType)
      .where('entityId', '==', entityId)
      .orderBy('createdAt', 'desc')
      .get();

    const shares = sharesQuery.docs.map(doc => ({
      id: doc.id,
      userId: doc.data().userId,
      createdAt: doc.data().createdAt
    }));

    return res.status(200).json({
      count: shares.length,
      shares: shares
    });
  } catch (error) {
    console.error('Error fetching shares:', error);
    return res.status(500).json({ message: error.message });
  }
};

// Check if user has interacted with entity
exports.checkUserInteraction = async (req, res) => {
  const { entityType, entityId, userId } = req.params;

  try {
    // Check for like
    const likeQuery = await db.collection('interactions')
      .where('type', '==', 'like')
      .where('entityType', '==', entityType)
      .where('entityId', '==', entityId)
      .where('userId', '==', userId)
      .get();

    // Check for share
    const shareQuery = await db.collection('interactions')
      .where('type', '==', 'share')
      .where('entityType', '==', entityType)
      .where('entityId', '==', entityId)
      .where('userId', '==', userId)
      .get();

    return res.status(200).json({
      hasLiked: !likeQuery.empty,
      hasShared: !shareQuery.empty
    });
  } catch (error) {
    console.error('Error checking user interaction:', error);
    return res.status(500).json({ message: error.message });
  }
};

// Batch get interactions for multiple entities
exports.getBatchInteractions = async (req, res) => {
  const { entityIds, entityType = 'post', userId } = req.body;

  if (!entityIds || !Array.isArray(entityIds) || entityIds.length === 0) {
    return res.status(400).json({ message: 'Entity IDs array is required' });
  }

  // Limit batch size to prevent query issues
  if (entityIds.length > 30) {
    return res.status(400).json({ message: 'Maximum 30 entities per batch request' });
  }

  console.log(`[BATCH] Getting interactions for ${entityIds.length} ${entityType}s`);

  try {
    // Initialize result object
    const result = {};
    entityIds.forEach(entityId => {
      result[entityId] = {
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        isLiked: false,
        hasShared: false,
        comments: [],
        likes: [],
        shares: []
      };
    });

    // Fetch all interactions for these entities in parallel
    const [likesSnapshot, commentsSnapshot, sharesSnapshot] = await Promise.all([
      db.collection('interactions')
        .where('type', '==', 'like')
        .where('entityType', '==', entityType)
        .where('entityId', 'in', entityIds)
        .get(),
      db.collection('interactions')
        .where('type', '==', 'comment')
        .where('entityType', '==', entityType)
        .where('entityId', 'in', entityIds)
        .orderBy('createdAt', 'desc')
        .get(),
      db.collection('interactions')
        .where('type', '==', 'share')
        .where('entityType', '==', entityType)
        .where('entityId', 'in', entityIds)
        .get()
    ]);

    // Process likes
    likesSnapshot.forEach(doc => {
      const data = doc.data();
      if (result[data.entityId]) {
        result[data.entityId].likeCount++;
        result[data.entityId].likes.push({
          userId: data.userId,
          createdAt: data.createdAt
        });
        // Check if current user liked this entity
        if (userId && data.userId === userId) {
          result[data.entityId].isLiked = true;
        }
      }
    });

    // Process comments
    commentsSnapshot.forEach(doc => {
      const data = doc.data();
      if (result[data.entityId]) {
        result[data.entityId].commentCount++;
        result[data.entityId].comments.push({
          id: doc.id,
          userId: data.userId,
          username: data.username,
          content: data.content,
          text: data.content, 
          createdAt: data.createdAt
        });
      }
    });

    // Process shares
    sharesSnapshot.forEach(doc => {
      const data = doc.data();
      if (result[data.entityId]) {
        result[data.entityId].shareCount++;
        result[data.entityId].shares.push({
          userId: data.userId,
          createdAt: data.createdAt
        });
        // Check if current user shared this entity
        if (userId && data.userId === userId) {
          result[data.entityId].hasShared = true;
        }
      }
    });

    console.log(`[BATCH] Successfully retrieved interactions for ${entityIds.length} entities`);
    return res.status(200).json(result);
  } catch (error) {
    console.error(`[BATCH] Error fetching batch interactions:`, error);
    
    // If it's a missing index error, provide helpful message
    if (error.code === 9) {
      return res.status(500).json({ 
        message: 'Database index not ready. Please wait for indexes to build in Firebase Console.',
        error: error.message 
      });
    }
    
    return res.status(500).json({ message: error.message });
  }
};