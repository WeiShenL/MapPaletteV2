const { db } = require('../config/firebase');
const { FieldValue } = require('firebase-admin/firestore');

exports.createPost = async (req, res) => {
  const { userID } = req.params;

  if (!userID) {
    return res.status(400).json({ message: 'User ID is required to create a post.' });
  }

  console.log(`[CREATE_POST] User ${userID} creating new post`);

  try {
    const docRef = db.collection('posts').doc();
    const postID = docRef.id;

    // Username from frontend
    const username = req.body.username || 'Unknown User';

    const postData = {
      userID: userID,
      username: username,
      title: req.body.title,
      description: req.body.description,
      waypoints: req.body.waypoints,
      color: req.body.color,
      likeCount: 0,
      shareCount: 0,
      commentCount: 0,
      image: req.body.image,
      postID: postID,
      createdAt: FieldValue.serverTimestamp(),
      region: req.body.region,
      distance: req.body.distance
    };

    await docRef.set(postData);

    console.log(`[CREATE_POST] Successfully created post ${postID} for user ${userID}`);
    return res.status(201).json({ id: postID, message: 'Post created successfully!' });
  } catch (error) {
    console.error(`[CREATE_POST] Error creating post for user ${userID}:`, error);
    return res.status(500).send(error);
  }
};

exports.getPost = async (req, res) => {
  const postID = req.query.id;

  if (!postID) {
    return res.status(400).json({ message: 'Post ID is required.' });
  }

  console.log(`[GET_POST] Fetching post ${postID}`);

  try {
    const postRef = db.collection('posts').doc(postID);
    const postSnap = await postRef.get();

    if (!postSnap.exists) {
      console.log(`[GET_POST] Post ${postID} not found`);
      return res.status(404).json({ message: 'Post not found' });
    }

    const postData = postSnap.data();
    
    // Return only post data 
    console.log(`[GET_POST] Successfully fetched post ${postID}`);
    return res.status(200).json({
      id: postID,
      postID: postID, // actl dunnit
      ...postData
    });
  } catch (error) {
    console.error(`[GET_POST] Error fetching post ${postID}:`, error);
    return res.status(500).json({ message: 'Error fetching post data.' });
  }
};

exports.updatePost = async (req, res) => {
  const postID = req.query.id;

  if (!postID) {
    return res.status(400).json({ message: 'Post ID is required.' });
  }

  console.log(`[UPDATE_POST] Updating post ${postID}`);

  try {
    const postRef = db.collection('posts').doc(postID);
    await postRef.update(req.body);

    console.log(`[UPDATE_POST] Successfully updated post ${postID}`);
    return res.status(200).json({ message: 'Post updated successfully!' });
  } catch (error) {
    console.error(`[UPDATE_POST] Error updating post ${postID}:`, error);
    return res.status(500).send(error);
  }
};

exports.deletePost = async (req, res) => {
  const postID = req.query.id;

  if (!postID) {
    return res.status(400).json({ message: 'Post ID is required.' });
  }

  console.log(`[DELETE_POST] Deleting post ${postID}`);

  try {
    const postRef = db.collection('posts').doc(postID);
    const postSnap = await postRef.get();

    if (!postSnap.exists) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    const subcollections = await postRef.listCollections();
    const batch = db.batch();

    for (const subcollection of subcollections) {
      const docs = await subcollection.get();
      docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
    }
    await batch.commit();

    await postRef.delete();

    console.log(`[DELETE_POST] Successfully deleted post ${postID}`);
    return res.status(200).json({ message: 'Post deleted successfully!' });
  } catch (error) {
    console.error(`[DELETE_POST] Error deleting post ${postID}:`, error);
    return res.status(500).json({ message: 'Error deleting post and its subcollections.' });
  }
};

exports.getAllPosts = async (req, res) => {
  console.log(`[GET_ALL_POSTS] Fetching all posts`);

  try {
    const postsSnap = await db.collection('posts')
      .orderBy('createdAt', 'desc')
      .get();

    if (postsSnap.empty) {
      return res.status(200).json([]); // Return empty array
    }

    // Return only post data 
    const posts = postsSnap.docs.map(doc => ({
      id: doc.id,
      postID: doc.id, // actl dunnit
      ...doc.data()
    }));

    console.log(`[GET_ALL_POSTS] Successfully fetched ${posts.length} posts`);
    return res.status(200).json(posts);
  } catch (error) {
    console.error(`[GET_ALL_POSTS] Error fetching posts:`, error);
    return res.status(500).json({ message: 'Error fetching posts.' });
  }
};

exports.updateInteractionCount = async (req, res) => {
  const { id } = req.params;
  const { field, increment } = req.body;
  
  if (!['likeCount', 'commentCount', 'shareCount'].includes(field)) {
    return res.status(400).json({ message: 'Invalid field' });
  }
  
  console.log(`[UPDATE_COUNT] Updating ${field} by ${increment} for post ${id}`);
  
  try {
    await db.collection('posts').doc(id).update({
      [field]: FieldValue.increment(increment)
    });
    
    console.log(`[UPDATE_COUNT] Successfully updated ${field} for post ${id}`);
    return res.status(200).json({ message: 'Count updated successfully' });
  } catch (error) {
    console.error(`[UPDATE_COUNT] Error updating ${field} for post ${id}:`, error);
    return res.status(500).json({ message: 'Error updating count' });
  }
};

exports.getUserPosts = async (req, res) => {
  const { userID } = req.params;

  if (!userID) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  console.log(`[GET_USER_POSTS] Fetching posts for user ${userID}`);

  try {
    // Query posts by userID 
    const postsSnap = await db.collection('posts')
      .where('userID', '==', userID)
      .orderBy('createdAt', 'desc')
      .get();

    if (postsSnap.empty) {
      return res.status(200).json([]); // Return empty array 
    }

    // Return only post data 
    const posts = postsSnap.docs.map(doc => ({
      id: doc.id,
      postID: doc.id, // actl dunnit
      ...doc.data()
    }));

    console.log(`[GET_USER_POSTS] Successfully fetched ${posts.length} posts for user ${userID}`);
    return res.status(200).json(posts);
  } catch (error) {
    console.error(`[GET_USER_POSTS] Error fetching posts for user ${userID}:`, error);
    return res.status(500).json({ message: 'Error fetching user posts.' });
  }
};