#!/bin/bash

# Firebase to PostgreSQL Migration Script
# This script helps migrate data from Firebase to Supabase PostgreSQL

set -e

echo "🔄 Firebase to PostgreSQL Migration"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if firebase service account file exists
FIREBASE_KEY="firebase-service-account.json"
if [ ! -f "$FIREBASE_KEY" ]; then
    echo -e "${RED}❌ Firebase service account key not found${NC}"
    echo -e "${YELLOW}Please download your Firebase service account key and save as: $FIREBASE_KEY${NC}"
    exit 1
fi

echo "📥 Installing migration dependencies..."
npm install --no-save firebase-admin pg

# Create migration script
cat > migrate.js << 'MIGRATION_SCRIPT'
const admin = require('firebase-admin');
const { PrismaClient } = require('./backend/shared/node_modules/@prisma/client');

const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();
const prisma = new PrismaClient();

async function migrateUsers() {
  console.log('📦 Migrating users...');
  const usersSnapshot = await firestore.collection('users').get();
  let count = 0;

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    try {
      await prisma.user.create({
        data: {
          id: doc.id,
          email: data.email,
          username: data.username,
          profilePicture: data.profilePicture || '/resources/default-profile.png',
          birthday: data.birthday || '1990-01-01',
          gender: data.gender || 'other',
          isProfilePrivate: data.isProfilePrivate || false,
          isPostPrivate: data.isPostPrivate || false,
          numFollowers: data.numFollowers || 0,
          numFollowing: data.numFollowing || 0,
          points: data.points || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
        },
      });
      count++;
    } catch (error) {
      console.error(`Error migrating user ${doc.id}:`, error.message);
    }
  }

  console.log(`✅ Migrated ${count} users`);
}

async function migratePosts() {
  console.log('📦 Migrating posts...');
  const postsSnapshot = await firestore.collection('posts').get();
  let count = 0;

  for (const doc of postsSnapshot.docs) {
    const data = doc.data();
    try {
      await prisma.post.create({
        data: {
          id: doc.id,
          userId: data.userID,
          title: data.title,
          description: data.description || '',
          waypoints: data.waypoints,
          color: data.color || '#FF0000',
          region: data.region,
          distance: parseFloat(data.distance) || 0,
          imageUrl: data.image || null,
          likeCount: data.likeCount || 0,
          commentCount: data.commentCount || 0,
          shareCount: data.shareCount || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
        },
      });
      count++;
    } catch (error) {
      console.error(`Error migrating post ${doc.id}:`, error.message);
    }
  }

  console.log(`✅ Migrated ${count} posts`);
}

async function migrateFollows() {
  console.log('📦 Migrating follows...');
  const followsSnapshot = await firestore.collection('follow_users').get();
  let count = 0;

  for (const doc of followsSnapshot.docs) {
    const data = doc.data();
    const followerId = doc.id;

    if (data.following && Array.isArray(data.following)) {
      for (const followingId of data.following) {
        try {
          await prisma.follow.create({
            data: {
              followerId: followerId,
              followingId: followingId,
              createdAt: new Date(),
            },
          });
          count++;
        } catch (error) {
          // Skip duplicates
        }
      }
    }
  }

  console.log(`✅ Migrated ${count} follows`);
}

async function migrateInteractions() {
  console.log('📦 Migrating interactions...');
  const interactionsSnapshot = await firestore.collection('interactions').get();
  let likes = 0, comments = 0, shares = 0;

  for (const doc of interactionsSnapshot.docs) {
    const data = doc.data();

    try {
      if (data.type === 'like') {
        await prisma.like.create({
          data: {
            userId: data.userId,
            postId: data.entityId,
            createdAt: data.createdAt?.toDate() || new Date(),
          },
        });
        likes++;
      } else if (data.type === 'comment') {
        await prisma.comment.create({
          data: {
            userId: data.userId,
            postId: data.entityId,
            content: data.content || '',
            createdAt: data.createdAt?.toDate() || new Date(),
          },
        });
        comments++;
      } else if (data.type === 'share') {
        await prisma.share.create({
          data: {
            userId: data.userId,
            postId: data.entityId,
            createdAt: data.createdAt?.toDate() || new Date(),
          },
        });
        shares++;
      }
    } catch (error) {
      // Skip duplicates or errors
    }
  }

  console.log(`✅ Migrated ${likes} likes, ${comments} comments, ${shares} shares`);
}

async function main() {
  try {
    await migrateUsers();
    await migratePosts();
    await migrateFollows();
    await migrateInteractions();

    console.log('');
    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Verify data in database');
    console.log('2. Test the application');
    console.log('3. Update frontend to use Supabase');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
    await admin.app().delete();
  }
}

main();
MIGRATION_SCRIPT

echo ""
echo -e "${GREEN}Migration script created!${NC}"
echo ""
echo -e "${YELLOW}To run the migration:${NC}"
echo "   1. Make sure your .env file has correct DATABASE_URL"
echo "   2. Make sure the database is running: docker compose up -d supabase-db"
echo "   3. Run: node migrate.js"
echo ""
echo -e "${RED}⚠️  Warning: This will add data to your PostgreSQL database${NC}"
echo -e "${YELLOW}Make sure to backup first if needed!${NC}"
echo ""
