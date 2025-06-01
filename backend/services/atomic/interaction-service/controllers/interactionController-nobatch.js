// this not in use now

const { db } = require('../config/firebase');
const { FieldValue } = require('firebase-admin/firestore');

// Create a like interaction
exports.likeEntity = async (req, res) => {
  const { entityType, entityId } = req.params;
  const { userId } = req.body;

  if (!entityType || !entityId || !userId) {
    return res.status(400).json({ message: 'Entity type, entity ID, and user ID are required.' });
  }

  try {
    // Check if already liked
    const existingLike = await db.collection('interactions')
      .where('type', '==', 'like')
      .where('entityType', '==', entityType)
      .where('entityId', '==', entityId)
      .where('userId', '==', userId)
      .get();

    if (!existingLike.empty) {
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

    return res.status(200).json({ 
      message: 'Entity liked successfully!',
      interactionId: interactionRef.id 
    });
  } catch (error) {
    console.error('Error liking entity:', error);
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

  try {
    // Find the like interaction
    const likeQuery = await db.collection('interactions')
      .where('type', '==', 'like')
      .where('entityType', '==', entityType)
      .where('entityId', '==', entityId)
      .where('userId', '==', userId)
      .get();

    if (likeQuery.empty) {
      return res.status(400).json({ message: 'User has not liked this entity yet.' });
    }

    // Delete the like interaction
    const batch = db.batch();
    likeQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    return res.status(200).json({ message: 'Entity unliked successfully!' });
  } catch (error) {
    console.error('Error unliking entity:', error);
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

    return res.status(200).json({ 
      message: 'Entity shared successfully!',
      interactionId: interactionRef.id 
    });
  } catch (error) {
    console.error('Error sharing entity:', error);
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

  try {
    // Create comment interaction
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

    return res.status(201).json({ 
      message: 'Comment added successfully!',
      commentId: interactionRef.id,
      comment: { id: interactionRef.id, ...commentData }
    });
  } catch (error) {
    console.error('Error adding comment:', error);
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

  try {
    // Get the comment
    const commentDoc = await db.collection('interactions').doc(commentId).get();
    
    if (!commentDoc.exists) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    const comment = commentDoc.data();
    
    // Verify ownership
    if (comment.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this comment.' });
    }

    // Delete the comment
    await db.collection('interactions').doc(commentId).delete();

    return res.status(200).json({ message: 'Comment deleted successfully!' });
  } catch (error) {
    console.error('Error deleting comment:', error);
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
        userID: data.userId, // For backward compatibility
        username: data.username,
        content: data.content,
        text: data.content, // For backward compatibility
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