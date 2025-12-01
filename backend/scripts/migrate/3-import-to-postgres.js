/**
 * Step 3: Import transformed data to PostgreSQL via Prisma
 *
 * This script imports the transformed JSON files into PostgreSQL
 * using Prisma Client with proper error handling and progress tracking.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();
const dataDir = path.join(__dirname, 'data');
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 100;
const DRY_RUN = process.env.DRY_RUN === 'true';

/**
 * Load JSON file
 */
async function loadJSON(fileName) {
  const filePath = path.join(dataDir, fileName);
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Import data in batches with progress tracking
 */
async function importInBatches(modelName, data, createFn) {
  console.log(`\n📥 Importing ${data.length} ${modelName}...`);

  if (DRY_RUN) {
    console.log(`   🔍 DRY RUN: Would import ${data.length} records`);
    return { success: data.length, failed: 0 };
  }

  const stats = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(data.length / BATCH_SIZE);

    console.log(`   Batch ${batchNum}/${totalBatches} (${batch.length} records)...`);

    for (const item of batch) {
      try {
        await createFn(item);
        stats.success++;
      } catch (error) {
        stats.failed++;
        stats.errors.push({
          item: item.id,
          error: error.message
        });

        // Log first 5 errors in detail
        if (stats.errors.length <= 5) {
          console.error(`   ⚠️  Failed to import ${item.id}: ${error.message}`);
        }
      }
    }
  }

  return stats;
}

/**
 * Import users
 */
async function importUsers(users) {
  return importInBatches('users', users, async (user) => {
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        profilePicture: user.profilePicture,
        birthday: user.birthday,
        gender: user.gender,
        isProfilePrivate: user.isProfilePrivate,
        isPostPrivate: user.isPostPrivate,
        numFollowers: user.numFollowers,
        numFollowing: user.numFollowing,
        points: user.points,
        createdAt: new Date(user.createdAt),
      }
    });
  });
}

/**
 * Import posts
 */
async function importPosts(posts) {
  return importInBatches('posts', posts, async (post) => {
    await prisma.post.create({
      data: {
        id: post.id,
        userId: post.userId,
        title: post.title,
        description: post.description,
        waypoints: post.waypoints,
        color: post.color,
        region: post.region,
        distance: post.distance,
        imageUrl: post.imageUrl,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        shareCount: post.shareCount,
        createdAt: new Date(post.createdAt),
      }
    });
  });
}

/**
 * Import follows
 */
async function importFollows(follows) {
  return importInBatches('follows', follows, async (follow) => {
    await prisma.follow.create({
      data: {
        id: follow.id,
        followerId: follow.followerId,
        followingId: follow.followingId,
        createdAt: new Date(follow.createdAt),
      }
    });
  });
}

/**
 * Import likes
 */
async function importLikes(likes) {
  return importInBatches('likes', likes, async (like) => {
    await prisma.like.create({
      data: {
        id: like.id,
        userId: like.userId,
        postId: like.postId,
        createdAt: new Date(like.createdAt),
      }
    });
  });
}

/**
 * Import comments
 */
async function importComments(comments) {
  return importInBatches('comments', comments, async (comment) => {
    await prisma.comment.create({
      data: {
        id: comment.id,
        userId: comment.userId,
        postId: comment.postId,
        text: comment.text,
        createdAt: new Date(comment.createdAt),
      }
    });
  });
}

/**
 * Import shares
 */
async function importShares(shares) {
  return importInBatches('shares', shares, async (share) => {
    await prisma.share.create({
      data: {
        id: share.id,
        userId: share.userId,
        postId: share.postId,
        createdAt: new Date(share.createdAt),
      }
    });
  });
}

/**
 * Main import function
 */
async function main() {
  console.log('🚀 Starting PostgreSQL import...\n');

  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No data will be written\n');
  }

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL\n');

    // Load transformed data
    console.log('📂 Loading transformed data...');
    const users = await loadJSON('users-transformed.json');
    const posts = await loadJSON('posts-transformed.json');
    const follows = await loadJSON('follows-transformed.json');
    const likes = await loadJSON('likes-transformed.json');
    const comments = await loadJSON('comments-transformed.json');
    const shares = await loadJSON('shares-transformed.json');

    console.log('✅ Data loaded\n');

    // Import in order (respecting foreign key constraints)
    const results = {};

    // 1. Users (no dependencies)
    results.users = await importUsers(users);

    // 2. Posts (depends on users)
    results.posts = await importPosts(posts);

    // 3. Follows (depends on users)
    results.follows = await importFollows(follows);

    // 4. Likes (depends on users and posts)
    results.likes = await importLikes(likes);

    // 5. Comments (depends on users and posts)
    results.comments = await importComments(comments);

    // 6. Shares (depends on users and posts)
    results.shares = await importShares(shares);

    // Summary
    console.log('\n✅ Import completed!\n');
    console.log('📊 Summary:');

    let totalSuccess = 0;
    let totalFailed = 0;

    Object.entries(results).forEach(([model, stats]) => {
      console.log(`\n   ${model}:`);
      console.log(`     ✅ Success: ${stats.success}`);
      console.log(`     ❌ Failed: ${stats.failed}`);

      if (stats.errors.length > 0) {
        console.log(`     First ${Math.min(5, stats.errors.length)} errors:`);
        stats.errors.slice(0, 5).forEach(({ item, error }) => {
          console.log(`       - ${item}: ${error}`);
        });

        if (stats.errors.length > 5) {
          console.log(`       ... and ${stats.errors.length - 5} more errors`);
        }
      }

      totalSuccess += stats.success;
      totalFailed += stats.failed;
    });

    console.log(`\n   TOTAL:`);
    console.log(`     ✅ Success: ${totalSuccess}`);
    console.log(`     ❌ Failed: ${totalFailed}`);

    // Save import summary
    await fs.writeFile(
      path.join(dataDir, '_import_summary.json'),
      JSON.stringify({
        importDate: new Date().toISOString(),
        dryRun: DRY_RUN,
        results,
        totalSuccess,
        totalFailed
      }, null, 2)
    );

    if (totalFailed > 0) {
      console.log('\n⚠️  Some records failed to import. Check _import_summary.json for details.');
    }

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  importUsers,
  importPosts,
  importFollows,
  importLikes,
  importComments,
  importShares
};
