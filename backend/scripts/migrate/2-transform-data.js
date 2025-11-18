/**
 * Step 2: Transform Firebase data to match PostgreSQL schema
 *
 * This script transforms the exported Firebase JSON files to match
 * the Prisma schema structure for PostgreSQL.
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const dataDir = path.join(__dirname, 'data');

/**
 * Load JSON file
 */
async function loadJSON(fileName) {
  const filePath = path.join(dataDir, fileName);
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Save JSON file
 */
async function saveJSON(fileName, data) {
  const filePath = path.join(dataDir, fileName);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

/**
 * Transform users collection
 * Firebase: uid, email, username, profilePicture, createdAt, etc.
 * Postgres: id (uuid), email, username, profilePicture, createdAt, etc.
 */
function transformUsers(firebaseUsers) {
  console.log('🔄 Transforming users...');

  return firebaseUsers.map(user => ({
    id: user.uid || user.id, // Use Firebase uid as PostgreSQL id
    email: user.email,
    username: user.username || user.email?.split('@')[0],
    profilePicture: user.profilePicture || '/resources/default-profile.png',
    birthday: user.birthday || null,
    gender: user.gender || null,
    isProfilePrivate: user.isProfilePrivate || false,
    isPostPrivate: user.isPostPrivate || false,
    numFollowers: user.numFollowers || 0,
    numFollowing: user.numFollowing || 0,
    points: user.points || 0,
    createdAt: user.createdAt || new Date().toISOString(),
  }));
}

/**
 * Transform posts collection
 * Firebase: postId, userId, title, description, waypoints, etc.
 * Postgres: id, userId, title, description, waypoints (JSON), etc.
 */
function transformPosts(firebasePosts) {
  console.log('🔄 Transforming posts...');

  return firebasePosts.map(post => {
    // Parse waypoints if it's a string
    let waypoints = post.waypoints;
    if (typeof waypoints === 'string') {
      try {
        waypoints = JSON.parse(waypoints);
      } catch (e) {
        console.warn(`⚠️  Failed to parse waypoints for post ${post.id}`);
        waypoints = [];
      }
    }

    return {
      id: post.postId || post.id,
      userId: post.userId || post.uid,
      title: post.title || 'Untitled Route',
      description: post.description || '',
      waypoints: waypoints || [],
      color: post.color || '#FF0000',
      region: post.region || 'Unknown',
      distance: parseFloat(post.distance) || 0,
      imageUrl: post.imageUrl || null,
      likeCount: post.likeCount || 0,
      commentCount: post.commentCount || 0,
      shareCount: post.shareCount || 0,
      createdAt: post.createdAt || new Date().toISOString(),
    };
  });
}

/**
 * Transform follows collection
 * Firebase: followerId, followingId, createdAt
 * Postgres: id (uuid), followerId, followingId, createdAt
 */
function transformFollows(firebaseFollows) {
  console.log('🔄 Transforming follows...');

  return firebaseFollows.map(follow => ({
    id: follow.id || crypto.randomUUID(),
    followerId: follow.followerUserId || follow.followerId,
    followingId: follow.followingUserId || follow.followingId,
    createdAt: follow.createdAt || new Date().toISOString(),
  }));
}

/**
 * Transform likes collection
 * Firebase: userId, postId, entityType, createdAt
 * Postgres: id (uuid), userId, postId, createdAt
 */
function transformLikes(firebaseLikes) {
  console.log('🔄 Transforming likes...');

  return firebaseLikes.map(like => ({
    id: like.id || crypto.randomUUID(),
    userId: like.userId,
    postId: like.postId || like.entityId,
    createdAt: like.createdAt || new Date().toISOString(),
  }));
}

/**
 * Transform comments collection
 * Firebase: userId, postId, text, createdAt
 * Postgres: id (uuid), userId, postId, text, createdAt
 */
function transformComments(firebaseComments) {
  console.log('🔄 Transforming comments...');

  return firebaseComments.map(comment => ({
    id: comment.id || crypto.randomUUID(),
    userId: comment.userId,
    postId: comment.postId || comment.entityId,
    text: comment.text || comment.content || '',
    createdAt: comment.createdAt || new Date().toISOString(),
  }));
}

/**
 * Transform shares collection
 * Firebase: userId, postId, createdAt
 * Postgres: id (uuid), userId, postId, createdAt
 */
function transformShares(firebaseShares) {
  console.log('🔄 Transforming shares...');

  return firebaseShares.map(share => ({
    id: share.id || crypto.randomUUID(),
    userId: share.userId,
    postId: share.postId || share.entityId,
    createdAt: share.createdAt || new Date().toISOString(),
  }));
}

/**
 * Main transformation function
 */
async function main() {
  console.log('🚀 Starting data transformation...\n');

  try {
    // Load Firebase data
    const users = await loadJSON('users.json');
    const posts = await loadJSON('posts.json');
    const follows = await loadJSON('follows.json');
    const likes = await loadJSON('likes.json');
    const comments = await loadJSON('comments.json');
    const shares = await loadJSON('shares.json');

    // Transform data
    const transformedUsers = transformUsers(users);
    const transformedPosts = transformPosts(posts);
    const transformedFollows = transformFollows(follows);
    const transformedLikes = transformLikes(likes);
    const transformedComments = transformComments(comments);
    const transformedShares = transformShares(shares);

    // Save transformed data
    await saveJSON('users-transformed.json', transformedUsers);
    await saveJSON('posts-transformed.json', transformedPosts);
    await saveJSON('follows-transformed.json', transformedFollows);
    await saveJSON('likes-transformed.json', transformedLikes);
    await saveJSON('comments-transformed.json', transformedComments);
    await saveJSON('shares-transformed.json', transformedShares);

    console.log('\n✅ Transformation completed successfully!');
    console.log('\n📊 Transformed records:');
    console.log(`   Users: ${transformedUsers.length}`);
    console.log(`   Posts: ${transformedPosts.length}`);
    console.log(`   Follows: ${transformedFollows.length}`);
    console.log(`   Likes: ${transformedLikes.length}`);
    console.log(`   Comments: ${transformedComments.length}`);
    console.log(`   Shares: ${transformedShares.length}`);

    // Save summary
    await saveJSON('_transform_summary.json', {
      transformDate: new Date().toISOString(),
      records: {
        users: transformedUsers.length,
        posts: transformedPosts.length,
        follows: transformedFollows.length,
        likes: transformedLikes.length,
        comments: transformedComments.length,
        shares: transformedShares.length,
      },
      total: transformedUsers.length + transformedPosts.length +
             transformedFollows.length + transformedLikes.length +
             transformedComments.length + transformedShares.length
    });

  } catch (error) {
    console.error('\n❌ Transformation failed:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  transformUsers,
  transformPosts,
  transformFollows,
  transformLikes,
  transformComments,
  transformShares
};
