// not in use ah

const { db, bucket, auth } = require('../config/firebase');
const { FieldValue } = require('firebase-admin/firestore');

// Create a new user
const createUser = async (req, res) => {
  const { email, password, username, profilePicture } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ message: 'Email, password, and username are required.' });
  }

  try {
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: username
    });

    // Create user document in Firestore with all required fields
    const userData = {
      email,
      username,
      profilePicture: profilePicture || '/resources/default-profile.png',
      createdAt: FieldValue.serverTimestamp(),
      isProfilePrivate: false,
      isPostPrivate: false,
      uid: userRecord.uid,
      numFollowers: 0,    // Initialize follower count
      numFollowing: 0     // Initialize following count
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    return res.status(201).json({
      message: 'User created successfully',
      uid: userRecord.uid,
      user: userData
    });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    return res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
  const { userID } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    console.log('Starting profile picture upload for user:', userID);
    console.log('File info:', { 
      originalname: req.file.originalname, 
      mimetype: req.file.mimetype, 
      size: req.file.size 
    });
    
    const filename = `profile-pictures/${userID}-${Date.now()}.${req.file.mimetype.split('/')[1]}`;
    console.log('Storage filename:', filename);
    
    const file = bucket.file(filename);

    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    stream.on('error', (error) => {
      console.error('Upload error:', error);
      return res.status(500).json({ message: 'Error uploading file' });
    });

    stream.on('finish', async () => {
      try {
        // Make the file publicly accessible
        await file.makePublic();
        
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
        console.log('File uploaded, public URL:', publicUrl);
        
        // Update user's profile picture URL in Firestore
        await db.collection('users').doc(userID).update({
          profilePicture: publicUrl
        });
        console.log('User document updated with profile picture URL');

        return res.status(200).json({ 
          message: 'Profile picture uploaded successfully',
          url: publicUrl
        });
      } catch (updateError) {
        console.error('Error updating user document:', updateError);
        return res.status(500).json({ message: 'File uploaded but failed to update user profile' });
      }
    });

    stream.end(req.file.buffer);
  } catch (error) {
    console.error('Error in uploadProfilePicture:', error);
    return res.status(500).json({ message: 'Error uploading profile picture' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  const { userID } = req.params;

  if (!userID) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    const userRef = db.collection('users').doc(userID);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json(userSnap.data());
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Error fetching user data.' });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const usersSnap = await db.collection('users').get();

    const users = await Promise.all(usersSnap.docs.map(async (doc) => {
      const userData = { id: doc.id, ...doc.data() };

      if (userData.isProfilePrivate) return undefined;

      const subcollectionRefs = await db.collection('users').doc(doc.id).listCollections();

      for (const subcollectionRef of subcollectionRefs) {
        const subcollectionDocs = await subcollectionRef.get();
        userData[subcollectionRef.id] = subcollectionDocs.docs.map(subDoc => ({
          id: subDoc.id,
          ...subDoc.data()
        }));
      }

      return userData;
    }));

    const filteredUsers = users.filter(user => user !== undefined);
    return res.status(200).json(filteredUsers);
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Error fetching users' });
  }
};

// Get user's followers
const getUserFollowers = async (req, res) => {
  const { userID } = req.params;
  
  if (!userID) {
    return res.status(400).json({ message: 'User ID is required.' });
  } 

  try {
    const followersSnap = await db.collection('users').doc(userID).collection('followers').get();

    if (followersSnap.empty) {
      return res.status(404).json({ message: 'No followers found for this user.' });
    }

    const followersUserIDs = followersSnap.docs.map(doc => doc.id);

    const followersUsersPromises = followersUserIDs.map(async (followerUserID) => {
      const userDoc = await db.collection('users').doc(followerUserID).get();
      return userDoc.exists ? { userID: followerUserID, ...userDoc.data() } : null;
    });

    const followersUsers = (await Promise.all(followersUsersPromises)).filter(user => user !== null);

    return res.status(200).json(followersUsers);
  } catch (error) {
    console.error('Error fetching followers:', error);
    return res.status(500).json({ message: 'Error fetching followers.' });
  }
};

// Get users that current user is following
const getUserFollowing = async (req, res) => {
  const { userID } = req.params;

  if (!userID) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    const followingSnap = await db.collection('users').doc(userID).collection('following').get();

    if (followingSnap.empty) {
      return res.status(404).json({ message: 'No following users found for this user.' });
    }

    const followingUserIDs = followingSnap.docs.map(doc => doc.id);

    const followingUsersPromises = followingUserIDs.map(async (followingUserID) => {
      const userDoc = await db.collection('users').doc(followingUserID).get();
      return userDoc.exists ? { userID: followingUserID, ...userDoc.data() } : null;
    });

    const followingUsers = (await Promise.all(followingUsersPromises)).filter(user => user !== null);

    return res.status(200).json(followingUsers);
  } catch (error) {
    console.error('Error fetching following users:', error);
    return res.status(500).json({ message: 'Error fetching following users.' });
  }
};

// Get condensed user data with following status
const getCondensedUsers = async (req, res) => {
  const { currentUserID } = req.params;

  if (!currentUserID) {
    return res.status(400).json({ message: 'Current user ID is required.' });
  }

  try {
    const usersSnap = await db.collection('users').get();

    const followingSnap = await db.collection('users').doc(currentUserID).collection('following').get();
    const followingIDs = followingSnap.docs.map(doc => doc.id);

    const condensedUsers = usersSnap.docs.map(doc => {
      const userData = doc.data();
      const isFollowing = followingIDs.includes(doc.id);

      if (userData.isProfilePrivate && !isFollowing) return undefined;

      return {
        userID: doc.id,
        username: userData.username || null,
        profilePicture: userData.profilePicture || null,
        isFollowing: isFollowing
      };
    });

    const filteredCondensedUsers = condensedUsers.filter(user => user !== undefined);
    return res.status(200).json(filteredCondensedUsers);
  } catch (error) {
    console.error('Error fetching condensed user data:', error);
    return res.status(500).json({ message: 'Error fetching condensed user data.' });
  }
};


// Update username
const updateUsername = async (req, res) => {
  const { userID } = req.params;
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ message: 'Username is required.' });
  }

  try {
    const userRef = db.collection('users').doc(userID);
    await userRef.update({ username });

    return res.status(200).json({ message: 'Username updated successfully!' });
  } catch (error) {
    console.error('Error updating username:', error);
    return res.status(500).json({ message: 'Error updating username.' });
  }
};

// Update profile picture
const updateProfilePicture = async (req, res) => {
  const { userID } = req.params;
  const { profilePicture } = req.body;

  if (!profilePicture) {
    return res.status(400).json({ message: 'Profile picture URL is required.' });
  }

  try {
    const userRef = db.collection('users').doc(userID);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const existingProfilePicture = userSnap.data().profilePicture;

    if (existingProfilePicture && existingProfilePicture !== profilePicture) {
      const fileName = existingProfilePicture.split('/').pop();
      const file = bucket.file(fileName);

      try {
        await file.delete();
        console.log('Previous profile picture deleted successfully.');
      } catch (error) {
        console.error('Error deleting previous profile picture:', error);
      }
    }

    await userRef.update({ profilePicture });

    return res.status(200).json({ message: 'Profile picture updated successfully!' });
  } catch (error) {
    console.error('Error updating profile picture:', error);
    return res.status(500).json({ message: 'Error updating profile picture.' });
  }
};

// Get user's liked posts
const getUserLikedPosts = async (req, res) => {
  const { userID } = req.params;

  if (!userID) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    const postsSnap = await db.collection('posts').get();

    if (postsSnap.empty) {
      return res.status(404).json({ message: 'No posts found.' });
    }

    const likedPosts = [];

    await Promise.all(postsSnap.docs.map(async (postDoc) => {
      const likeSnap = await postDoc.ref.collection('likes').doc(userID).get();
      if (likeSnap.exists) {
        likedPosts.push(postDoc.id);
      }
    }));

    return res.status(200).json({ likedPostIDs: likedPosts });
  } catch (error) {
    console.error('Error fetching liked posts:', error);
    return res.status(500).json({ message: 'Error fetching liked posts.' });
  }
};

// Update privacy settings
const updatePrivacySettings = async (req, res) => {
  const { userID } = req.params;
  const { isProfilePrivate, isPostPrivate } = req.body;

  if (typeof isProfilePrivate === 'undefined' || typeof isPostPrivate === 'undefined') {
    return res.status(400).json({ message: 'Both isProfilePrivate and isPostPrivate are required.' });
  }

  try {
    const userRef = db.collection('users').doc(userID);
    await userRef.update({
      isProfilePrivate,
      isPostPrivate
    });
    return res.status(200).json({ message: 'Privacy settings updated successfully!' });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    return res.status(500).json({ message: 'Error updating privacy settings.' });
  }
};

// Delete user (Admin only)
const deleteUser = async (req, res) => {
  const { userID } = req.params;

  if (!userID) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    // TODO: Add admin authentication check here
    
    const userRef = db.collection('users').doc(userID);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Delete user document
    await userRef.delete();

    return res.status(200).json({ message: 'User deleted successfully!' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ message: 'Error deleting user.' });
  }
};

// Assign default profile picture (Admin only)
const assignDefaultProfilePicture = async (req, res) => {
  try {
    // TODO: Add admin authentication check here
    
    const usersSnap = await db.collection('users').get();
    const defaultProfilePicture = '/resources/default-profile.png';

    const updatePromises = usersSnap.docs.map(async (doc) => {
      const userData = doc.data();
      if (!userData.profilePicture) {
        await doc.ref.update({ profilePicture: defaultProfilePicture });
      }
    });

    await Promise.all(updatePromises);

    return res.status(200).json({ message: 'Default profile pictures assigned successfully!' });
  } catch (error) {
    console.error('Error assigning default profile pictures:', error);
    return res.status(500).json({ message: 'Error assigning default profile pictures.' });
  }
};



// Update user points
const updateUserPoints = async (req, res) => {
  const { userID } = req.params;
  const { points } = req.body;

  if (typeof points !== 'number') {
    return res.status(400).json({ message: 'Points must be a number.' });
  }

  try {
    const userRef = db.collection('users').doc(userID);
    await userRef.update({
      points: FieldValue.increment(points)
    });
    
    return res.status(200).json({ message: 'User points updated successfully!' });
  } catch (error) {
    console.error('Error updating user points:', error);
    return res.status(500).json({ message: 'Error updating user points.' });
  }
};

// Update user counts (followers, following, etc.)
const updateUserCount = async (req, res) => {
  const { userID } = req.params;
  const { field, increment } = req.body;

  if (!field || typeof increment !== 'number') {
    return res.status(400).json({ message: 'Field and increment are required.' });
  }

  // Validate allowed fields
  const allowedFields = ['numFollowers', 'numFollowing', 'followersCount', 'followingCount', 'likeCount', 'commentCount', 'shareCount'];
  if (!allowedFields.includes(field)) {
    return res.status(400).json({ message: 'Invalid field. Allowed fields: ' + allowedFields.join(', ') });
  }

  try {
    const userRef = db.collection('users').doc(userID);
    await userRef.update({
      [field]: FieldValue.increment(increment)
    });
    
    return res.status(200).json({ message: `User ${field} updated successfully!` });
  } catch (error) {
    console.error(`Error updating user ${field}:`, error);
    return res.status(500).json({ message: `Error updating user ${field}.` });
  }
};

module.exports = {
  createUser,
  uploadProfilePicture,
  getUserById,
  getAllUsers,
  getUserFollowers,
  getUserFollowing,
  getCondensedUsers,
  updateUsername,
  updateProfilePicture,
  getUserLikedPosts,
  updatePrivacySettings,
  deleteUser,
  assignDefaultProfilePicture,
  updateUserPoints,
  updateUserCount
};