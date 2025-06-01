const { db } = require('../config/firebase');
const { FieldValue } = require('firebase-admin/firestore');
const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001/api/users';

async function addPointsToUser(userId, points) {
  try {
    await axios.put(`${USER_SERVICE_URL}/${userId}/points`, { points });
  } catch (error) {
    console.error('Error adding points to user:', error.message);
  }
}

exports.createComment = async (req, res) => {
  const postID = req.params.postId;
  const { userID, text } = req.body;

  if (!userID || !text) {
    return res.status(400).json({ message: 'UserID and comment text are required.' });
  }

  try {
    const commentData = {
      userID,
      text,
      createdAt: FieldValue.serverTimestamp(),
      likes: 0,
    };

    const commentRef = await db.collection('posts').doc(postID).collection('comments').add(commentData);

    await db.collection('posts').doc(postID).update({
      commentCount: FieldValue.increment(1),
    });

    const commentCheckRef = db.collection('posts').doc(postID).collection('commentPoints').doc(userID);
    const commentCheckDoc = await commentCheckRef.get();
    
    if (!commentCheckDoc.exists) {
      await addPointsToUser(userID, 2);
      await commentCheckRef.set({ createdAt: FieldValue.serverTimestamp() });
   }   

    return res.status(201).json({ id: commentRef.id, message: 'Comment created successfully!' });
  } catch (error) {
    console.error('Error creating comment:', error);
    return res.status(500).send(error);
  }
};

exports.getComments = async (req, res) => {
  const postID = req.params.postId;

  try {
    const commentsSnap = await db.collection('posts').doc(postID).collection('comments').orderBy('createdAt').get();

    if (commentsSnap.empty) {
      return res.status(200).json([]);
    }

    const comments = commentsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return res.status(500).send(error);
  }
};

exports.updateComment = async (req, res) => {
  const { postId, commentId } = req.params;
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: 'Updated comment text is required.' });
  }

  try {
    const commentRef = db.collection('posts').doc(postId).collection('comments').doc(commentId);
    await commentRef.update({ text });

    return res.status(200).json({ message: 'Comment updated successfully!' });
  } catch (error) {
    console.error('Error updating comment:', error);
    return res.status(500).send(error);
  }
};

exports.deleteComment = async (req, res) => {
  const { postId, commentId } = req.params;

  try {
    const commentRef = db.collection('posts').doc(postId).collection('comments').doc(commentId);

    const commentSnap = await commentRef.get();
    if (!commentSnap.exists) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    await commentRef.delete();

    await db.collection('posts').doc(postId).update({
      commentCount: FieldValue.increment(-1),
    });

    return res.status(200).json({ message: 'Comment deleted successfully!' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return res.status(500).send(error);
  }
};