const { db } = require('../config/firebase');
const { FieldValue } = require('firebase-admin/firestore');

// Helper function to ensure user document exists in follow_users collection
async function ensureUserDocument(userId) {
  const userRef = db.collection('follow_users').doc(userId);
  const userDoc = await userRef.get();
  
  if (!userDoc.exists) {
    await userRef.set({
      userId: userId,
      followers: [],
      following: [],
      followersCount: 0,
      followingCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
  }
  
  return userRef;
}

// Create a follow relationship
exports.createFollow = async (req, res) => {
  try {
    const { followerUserId, followingUserId } = req.body;

    if (!followerUserId || !followingUserId) {
      return res.status(400).json({ error: 'Both followerUserId and followingUserId are required' });
    }

    if (followerUserId === followingUserId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    console.log(`[FOLLOW] Creating follow: ${followerUserId} -> ${followingUserId}`);

    // Ensure both users have documents in follow_users collection
    const followerRef = await ensureUserDocument(followerUserId);
    const followingRef = await ensureUserDocument(followingUserId);

    // Get current data
    const followerDoc = await followerRef.get();
    const followingDoc = await followingRef.get();

    const followerData = followerDoc.data();
    const followingData = followingDoc.data();

    // Check if already following
    if (followerData.following.includes(followingUserId)) {
      console.log(`[FOLLOW] Already exists: ${followerUserId} -> ${followingUserId}`);
      return res.status(409).json({ error: 'Follow relationship already exists' });
    }

    // Use a batch write for atomicity
    const batch = db.batch();

    // Update follower's following array
    batch.update(followerRef, {
      following: FieldValue.arrayUnion(followingUserId),
      followingCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp()
    });

    // Update following's followers array
    batch.update(followingRef, {
      followers: FieldValue.arrayUnion(followerUserId),
      followersCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp()
    });

    // Commit the batch
    await batch.commit();

    console.log(`[FOLLOW] Successfully created: ${followerUserId} -> ${followingUserId}`);
    res.status(201).json({
      message: 'Follow relationship created successfully',
      followerId: followerUserId,
      followingId: followingUserId
    });
  } catch (error) {
    console.error(`[FOLLOW] Error creating follow ${followerUserId} -> ${followingUserId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a follow relationship
exports.deleteFollow = async (req, res) => {
  try {
    const { followerUserId, followingUserId } = req.body;

    if (!followerUserId || !followingUserId) {
      return res.status(400).json({ error: 'Both followerUserId and followingUserId are required' });
    }

    console.log(`[UNFOLLOW] Deleting follow: ${followerUserId} -> ${followingUserId}`);

    // Get user documents
    const followerRef = db.collection('follow_users').doc(followerUserId);
    const followingRef = db.collection('follow_users').doc(followingUserId);

    const followerDoc = await followerRef.get();
    const followingDoc = await followingRef.get();

    if (!followerDoc.exists || !followingDoc.exists) {
      return res.status(404).json({ error: 'User not found in follow system' });
    }

    const followerData = followerDoc.data();

    // Check if follow relationship exists
    if (!followerData.following.includes(followingUserId)) {
      console.log(`[UNFOLLOW] Not found: ${followerUserId} -> ${followingUserId}`);
      return res.status(404).json({ error: 'Follow relationship not found' });
    }

    // Use a batch write for atomicity
    const batch = db.batch();

    // Remove from follower's following array
    batch.update(followerRef, {
      following: FieldValue.arrayRemove(followingUserId),
      followingCount: FieldValue.increment(-1),
      updatedAt: FieldValue.serverTimestamp()
    });

    // Remove from following's followers array
    batch.update(followingRef, {
      followers: FieldValue.arrayRemove(followerUserId),
      followersCount: FieldValue.increment(-1),
      updatedAt: FieldValue.serverTimestamp()
    });

    // Commit the batch
    await batch.commit();

    console.log(`[UNFOLLOW] Successfully deleted: ${followerUserId} -> ${followingUserId}`);
    res.status(200).json({
      message: 'Follow relationship deleted successfully'
    });
  } catch (error) {
    console.error(`[UNFOLLOW] Error deleting follow ${followerUserId} -> ${followingUserId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get followers of a user
exports.getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log(`[GET_FOLLOWERS] Fetching followers for user ${userId}`);

    const userRef = db.collection('follow_users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(200).json({
        followers: [],
        count: 0
      });
    }

    const userData = userDoc.data();

    console.log(`[GET_FOLLOWERS] Found ${userData.followersCount || 0} followers for user ${userId}`);
    res.status(200).json({
      followers: userData.followers || [],
      count: userData.followersCount || 0
    });
  } catch (error) {
    console.error(`[GET_FOLLOWERS] Error fetching followers for user ${userId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get users that a user is following
exports.getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log(`[GET_FOLLOWING] Fetching following list for user ${userId}`);

    const userRef = db.collection('follow_users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(200).json({
        following: [],
        count: 0
      });
    }

    const userData = userDoc.data();

    console.log(`[GET_FOLLOWING] User ${userId} follows ${userData.followingCount || 0} users`);
    res.status(200).json({
      following: userData.following || [],
      count: userData.followingCount || 0
    });
  } catch (error) {
    console.error(`[GET_FOLLOWING] Error fetching following for user ${userId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Check if user A follows user B
exports.checkFollow = async (req, res) => {
  try {
    const { followerUserId, followingUserId } = req.query;

    if (!followerUserId || !followingUserId) {
      return res.status(400).json({ error: 'Both followerUserId and followingUserId are required' });
    }

    console.log(`[CHECK_FOLLOW] Checking if ${followerUserId} follows ${followingUserId}`);

    const followerRef = db.collection('follow_users').doc(followerUserId);
    const followerDoc = await followerRef.get();

    if (!followerDoc.exists) {
      return res.status(200).json({
        isFollowing: false
      });
    }

    const followerData = followerDoc.data();
    const isFollowing = followerData.following.includes(followingUserId);

    console.log(`[CHECK_FOLLOW] Result: ${followerUserId} ${isFollowing ? 'follows' : 'does not follow'} ${followingUserId}`);
    res.status(200).json({
      isFollowing
    });
  } catch (error) {
    console.error(`[CHECK_FOLLOW] Error checking follow ${followerUserId} -> ${followingUserId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get follow statistics for a user
exports.getFollowStats = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const userRef = db.collection('follow_users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(200).json({
        followersCount: 0,
        followingCount: 0
      });
    }

    const userData = userDoc.data();

    res.status(200).json({
      followersCount: userData.followersCount || 0,
      followingCount: userData.followingCount || 0
    });
  } catch (error) {
    console.error('Error getting follow stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Sync follow counts (utility function for data consistency)
exports.syncFollowCounts = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const userRef = db.collection('follow_users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found in follow system' });
    }

    const userData = userDoc.data();
    const actualFollowersCount = (userData.followers || []).length;
    const actualFollowingCount = (userData.following || []).length;

    // Update counts to match array lengths
    await userRef.update({
      followersCount: actualFollowersCount,
      followingCount: actualFollowingCount,
      updatedAt: FieldValue.serverTimestamp()
    });

    console.log(`[SYNC] Synced counts for user ${userId}: followers=${actualFollowersCount}, following=${actualFollowingCount}`);
    res.status(200).json({
      message: 'Follow counts synced successfully',
      followersCount: actualFollowersCount,
      followingCount: actualFollowingCount
    });
  } catch (error) {
    console.error(`[SYNC] Error syncing follow counts for user ${userId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};